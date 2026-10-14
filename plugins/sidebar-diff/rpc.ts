import { Rpc } from "@opencode/plugin/rpc"

export const SidebarChanges = Rpc.define({
  id: "mdc-git.sidebar-diff",
  methods: {},
  events: {
    changed: { schema: { type: "object", additionalProperties: false } },
  },
})
