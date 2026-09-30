// /api/* is routed here first (assets.run_worker_first); other paths only arrive when no static asset matches.
export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/placeholder_route") {
      return Response.json({ placeholder_variable: env.placeholder_variable });
    }
    return new Response("Not found", { status: 404 });
  },
};
