import { prisma } from "../../db/prisma";
import { Errors, AppError } from "../../lib/errors";
import { paginate, ok as okRes } from "../../lib/response";
import { injectTenantContext } from "../../middleware/auth.middleware";
import { signInviteToken, verifyInviteToken } from "./invite-token";
import type { UserContext } from "../../types/context";
import { Role } from "@fleet/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userSelect() {
    return {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Never expose passwordHash
        vehicle: {
            select: {
                id: true,
                licensePlate: true,
                make: true,
                model: true,
                status: true,
            },
        },
    };
}

// ─── List Users ───────────────────────────────────────────────────────────────

export async function listUsers(
    user: UserContext,
    input: {
        page?: number;
        pageSize?: number;
        search?: string;
        role?: Role;
    }
) {
    return injectTenantContext(user, async () => {
        const page = Math.max(1, input.page ?? 1);
        const pageSize = Math.min(100, input.pageSize ?? 20);
        const skip = (page - 1) * pageSize;

        const where: any = {
            tenantId: user.tenantId,
            deletedAt: null,
        };

        if (input.role) where.role = input.role;

        if (input.search) {
            where.OR = [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: userSelect(),
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.user.count({ where }),
        ]);

        return paginate(users, total, page, pageSize);
    });
}

// ─── Get Single User ──────────────────────────────────────────────────────────

export async function getUser(user: UserContext, targetId: string) {
    return injectTenantContext(user, async () => {
        const found = await prisma.user.findFirst({
            where: {
                id: targetId,
                tenantId: user.tenantId,
                deletedAt: null,
            },
            select: userSelect(),
        });

        if (!found) throw Errors.NOT_FOUND("User");
        return found;
    });
}

// ─── Invite User ──────────────────────────────────────────────────────────────

export async function inviteUser(
    user: UserContext,
    input: { name: string; email: string; role: Role }
) {
    return injectTenantContext(user, async () => {
        // Check email not already in use anywhere on platform
        const existing = await prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existing) throw Errors.EMAIL_TAKEN;

        // Fetch tenant for name
        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId },
        });

        // Create user with a temporary random password
        // They must set their real password via accept-invite
        const tempHash = await Bun.password.hash(
            crypto.randomUUID(), // random — they can't login until they accept invite
            { algorithm: "bcrypt", cost: 10 }
        );

        const newUser = await prisma.user.create({
            data: {
                tenantId: user.tenantId,
                name: input.name,
                email: input.email,
                role: input.role,
                passwordHash: tempHash,
            },
            select: userSelect(),
        });

        // Generate invite token
        const inviteToken = await signInviteToken({
            email: input.email,
            tenantId: user.tenantId,
            role: input.role,
        });

        // In production this would send an email via Resend
        // For now we return the token so you can test it
        const inviteUrl = `${process.env.WEB_URL ?? "http://localhost:5173"}/accept-invite?token=${inviteToken}`;

        console.log(`
            📧 [INVITE] New user invited:
            Email:  ${input.email}
            Role:   ${input.role}
            Tenant: ${tenant?.name}
            URL:    ${inviteUrl}
    `);

        return {
            user: newUser,
            inviteUrl, // Remove this in production — only send via email
            // inviteToken is NOT returned — only sent via email
        };
    });
}

// ─── Accept Invite ────────────────────────────────────────────────────────────

export async function acceptInvite(input: {
    token: string;
    password: string;
    name?: string;
}) {
    // Verify invite token (no tenant context needed — public endpoint)
    const payload = await verifyInviteToken(input.token);
    if (!payload) {
        throw new AppError("INVITE_INVALID", "Invite link is invalid or has expired", 400);
    }

    // Find the user
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });
    if (!user || user.deletedAt) {
        throw new AppError("INVITE_INVALID", "Invite link is no longer valid", 400);
    }

    // Set real password
    const passwordHash = await Bun.password.hash(input.password, {
        algorithm: "bcrypt",
        cost: 12,
    });

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            ...(input.name ? { name: input.name } : {}),
        },
        select: userSelect(),
    });

    return updated;
}

// ─── Update User ──────────────────────────────────────────────────────────────

export async function updateUser(
    user: UserContext,
    targetId: string,
    input: { name?: string }
) {
    return injectTenantContext(user, async () => {
        const target = await prisma.user.findFirst({
            where: { id: targetId, tenantId: user.tenantId, deletedAt: null },
        });
        if (!target) throw Errors.NOT_FOUND("User");

        const updated = await prisma.user.update({
            where: { id: targetId },
            data: { ...input, updatedAt: new Date() },
            select: userSelect(),
        });

        return updated;
    });
}

// ─── Change Role ──────────────────────────────────────────────────────────────

export async function changeRole(
    user: UserContext,
    targetId: string,
    newRole: Role
) {
    return injectTenantContext(user, async () => {
        // Can't change own role
        if (targetId === user.userId) {
            throw Errors.VALIDATION("You cannot change your own role");
        }

        const target = await prisma.user.findFirst({
            where: { id: targetId, tenantId: user.tenantId, deletedAt: null },
            include: { vehicle: true },
        });
        if (!target) throw Errors.NOT_FOUND("User");

        // If demoting a driver who is assigned to a vehicle — unassign first
        if (target.role === Role.DRIVER && newRole !== Role.DRIVER && target.vehicle) {
            await prisma.vehicle.update({
                where: { id: target.vehicle.id },
                data: { assignedDriverId: null },
            });
        }

        const updated = await prisma.user.update({
            where: { id: targetId },
            data: { role: newRole },
            select: userSelect(),
        });

        return updated;
    });
}

// ─── Soft Delete User ─────────────────────────────────────────────────────────

export async function deleteUser(user: UserContext, targetId: string) {
    return injectTenantContext(user, async () => {
        // Can't delete yourself
        if (targetId === user.userId) {
            throw Errors.VALIDATION("You cannot delete your own account");
        }

        const target = await prisma.user.findFirst({
            where: { id: targetId, tenantId: user.tenantId, deletedAt: null },
            include: { vehicle: true },
        });
        if (!target) throw Errors.NOT_FOUND("User");

        // If driver is on active trip — block deletion
        if (target.role === Role.DRIVER) {
            const activeTrip = await prisma.trip.findFirst({
                where: {
                    driverId: targetId,
                    status: { in: ["ACTIVE", "PENDING"] },
                },
            });
            if (activeTrip) {
                throw Errors.VALIDATION("Cannot delete a driver with an active trip. End the trip first.");
            }

            // Unassign from vehicle
            if (target.vehicle) {
                await prisma.vehicle.update({
                    where: { id: target.vehicle.id },
                    data: { assignedDriverId: null },
                });
            }
        }

        // Revoke all sessions
        await prisma.refreshToken.updateMany({
            where: { userId: targetId, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        // Soft delete
        await prisma.user.update({
            where: { id: targetId },
            data: { deletedAt: new Date() },
        });

        return { deleted: true, userId: targetId };
    });
}

// ─── Change Password (self) ───────────────────────────────────────────────────

export async function changePassword(
    user: UserContext,
    input: { currentPassword: string; newPassword: string }
) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) throw Errors.USER_NOT_FOUND;

    const valid = await Bun.password.verify(input.currentPassword, dbUser.passwordHash);
    if (!valid) {
        throw new AppError("WRONG_PASSWORD", "Current password is incorrect", 401);
    }

    const newHash = await Bun.password.hash(input.newPassword, {
        algorithm: "bcrypt",
        cost: 12,
    });

    await prisma.user.update({
        where: { id: user.userId },
        data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens — force re-login everywhere
    await prisma.refreshToken.updateMany({
        where: { userId: user.userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });

    return { message: "Password changed successfully. Please log in again." };
}

// ─── Team Stats ───────────────────────────────────────────────────────────────

export async function getTeamStats(user: UserContext) {
    return injectTenantContext(user, async () => {
        const [total, managers, drivers, activeDrivers] = await Promise.all([
            prisma.user.count({
                where: { tenantId: user.tenantId, deletedAt: null },
            }),
            prisma.user.count({
                where: { tenantId: user.tenantId, deletedAt: null, role: Role.FLEET_MANAGER },
            }),
            prisma.user.count({
                where: { tenantId: user.tenantId, deletedAt: null, role: Role.DRIVER },
            }),
            // Drivers currently on a trip
            prisma.trip.count({
                where: { tenantId: user.tenantId, status: "ACTIVE" },
            }),
        ]);

        return { total, managers, drivers, activeDrivers };
    });
}