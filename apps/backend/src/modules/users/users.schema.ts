import { t } from "elysia";

export const InviteUserBody = t.Object({
  name:  t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: "email" }),
  role:  t.Union([
    t.Literal("FLEET_MANAGER"),
    t.Literal("DRIVER"),
  ]),
});

export const UpdateUserBody = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
});

export const ChangeRoleBody = t.Object({
  role: t.Union([
    t.Literal("FLEET_MANAGER"),
    t.Literal("DRIVER"),
  ]),
});

export const AcceptInviteBody = t.Object({
  token:    t.String(),
  password: t.String({ minLength: 8 }),
  name:     t.Optional(t.String({ minLength: 2, maxLength: 100 })),
});

export const ChangePasswordBody = t.Object({
  currentPassword: t.String({ minLength: 1 }),
  newPassword:     t.String({ minLength: 8 }),
});

export const UserListQuery = t.Object({
  page:     t.Optional(t.Numeric({ minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  search:   t.Optional(t.String()),
  role:     t.Optional(t.Union([
    t.Literal("FLEET_MANAGER"),
    t.Literal("DRIVER"),
  ])),
});

export const UserIdParam = t.Object({
  id: t.String(),
});