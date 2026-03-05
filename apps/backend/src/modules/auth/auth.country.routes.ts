import Elysia, { t } from "elysia";
import { listCountries, getCountry } from "../../config/countries";
import { ok as okRes } from "../../lib/response";

export const countryRoutes = new Elysia({ prefix: "/countries" })

  // GET /countries — full list for registration dropdown
  .get("/", () => okRes(listCountries()), {
    detail: {
      tags:    ["Countries"],
      summary: "List all supported countries",
    },
  })

  // GET /countries/:code — full config for a specific country
  .get("/:code", ({ params }) => {
    const cfg = getCountry(params.code);
    return okRes(cfg);
  }, {
    params: t.Object({ code: t.String() }),
    detail: {
      tags:    ["Countries"],
      summary: "Get country config (tax, currency, compliance docs)",
    },
  });