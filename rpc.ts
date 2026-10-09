import { Rpc } from "@opencode/plugin/rpc"

export const SidebarChanges = Rpc.define({
  id: "local.sidebar-diff",
  methods: {},
  events: {
    changed: { schema: { type: "object", additionalProperties: false } },
  },
})
