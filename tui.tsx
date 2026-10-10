/** @jsxImportSource @opentui/solid */

import { MouseButton } from "@opentui/core"
import type { Vcs } from "@opencode/plugin"
import { Plugin } from "@opencode/plugin/tui"
import { For, Show, createMemo, createResource, createSignal, onCleanup } from "solid-js"
import { SidebarChanges } from "./rpc"

function currentSessionID(context: Plugin.Context) {
  const activeTab = context.ui.tabs.list().find((tab) => tab.active)
  if (activeTab) return activeTab.sessionID

  const route = context.ui.router.current()
  return route.type === "session" ? route.sessionID : undefined
}

function FileRow(props: {
  context: Plugin.Context
  file: Vcs.FileStatus
  onOpen: (file: Vcs.FileStatus) => void
}) {
  const [hovered, setHovered] = createSignal(false)
  const markerColor = () => {
    if (props.file.status === "added") return props.context.theme.diff.text.added
    if (props.file.status === "deleted") return props.context.theme.diff.text.removed
    return props.context.theme.text.base
  }

  return (
    <box
      flexDirection="row"
      gap={1}
      width="100%"
      height={1}
      backgroundColor={
        hovered() ? props.context.theme.background.raised.base : props.context.theme.background.base
      }
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseUp={(event) => {
        if (event.button !== MouseButton.LEFT) return
        event.stopPropagation()
        props.onOpen(props.file)
      }}
    >
      <text fg={markerColor()} width={1} wrapMode="none">
        {{ added: "+", deleted: "-", modified: "~" }[props.file.status]}
      </text>
      <text
        fg={hovered() ? props.context.theme.text.base : props.context.theme.text.muted}
        flexGrow={1}
        wrapMode="none"
      >
        {props.file.file}
      </text>
      <text fg={props.context.theme.diff.text.added} wrapMode="none">
        +{props.file.additions}
      </text>
      <text fg={props.context.theme.diff.text.removed} wrapMode="none">
        -{props.file.deletions}
      </text>
    </box>
  )
}

function DiffCloseButton(props: { context: Plugin.Context }) {
  const context = props.context
  const visible = createMemo(() => {
    const route = context.ui.router.current()
    return route.type === "plugin" && route.name === "diff"
  })
  const close = () => {
    const route = context.ui.router.current()
    if (route.type !== "plugin" || route.name !== "diff") return

    const returnRoute = route.data?.returnRoute
    if (returnRoute && typeof returnRoute === "object" && "type" in returnRoute) {
      context.ui.router.navigate(returnRoute)
      return
    }

    const sessionID = currentSessionID(context)
    context.ui.router.navigate(sessionID ? { type: "session", sessionID } : { type: "home" })
  }

  context.keymap.layer(() => ({
    mode: "global",
    priority: 1000,
    enabled: visible,
    commands: [
      {
        id: "local.sidebar-diff.close",
        title: "Close diff viewer",
        bind: "escape,q",
        run: close,
      },
    ],
  }))

  return (
    <Show when={visible()}>
      <box
        position="absolute"
        top={0}
        right={1}
        zIndex={3000}
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={context.theme.background.raised.high}
        onMouseUp={(event) => {
          if (event.button !== MouseButton.LEFT) return
          event.stopPropagation()
          close()
        }}
      >
        <text fg={context.theme.text.base}>× close</text>
      </box>
    </Show>
  )
}

function SidebarDiff(props: { context: Plugin.Context }) {
  const context = props.context
  const directory = createMemo(() => {
    const sessionID = currentSessionID(context)
    const location = sessionID ? context.data.session.get(sessionID)?.location : undefined
    return (location ?? context.location ?? context.data.location.default()).directory
  })
  const controller = new AbortController()
  const [changes, { refetch }] = createResource(directory, (directory) =>
    context.client.vcs.status({ location: { directory } }, { signal: controller.signal }),
  )
  const files = () =>
    !changes.error && changes()?.location.directory === directory() ? changes()!.data : []
  let selectionTimer: ReturnType<typeof setTimeout> | undefined

  const openFile = (file: Vcs.FileStatus) => {
    const ordered = files().toSorted((left, right) => {
      const a = left.file.split("/").filter(Boolean)
      const b = right.file.split("/").filter(Boolean)
      for (let index = 0; index < Math.min(a.length, b.length); index++) {
        const kind = Number(index === a.length - 1) - Number(index === b.length - 1)
        if (kind) return kind
        if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1
      }
      return 0
    })
    const position = ordered.findIndex((item) => item.file === file.file)
    context.keymap.dispatch("diff.open")
    if (position <= 0) return

    if (selectionTimer) clearTimeout(selectionTimer)
    selectionTimer = setTimeout(() => {
      for (let offset = 0; offset < position; offset++) context.keymap.dispatch("diff.next_file")
    }, 300)
  }

  onCleanup(
    context.ui.slot({
      append: "sidebar.content",
      render: () => (
        <box flexDirection="column" width="100%" paddingTop={1} paddingBottom={1}>
          <box flexDirection="row" gap={1} height={1}>
            <text fg={context.theme.text.base}>Changes</text>
            <Show when={!changes.loading && !changes.error}>
              <text fg={context.theme.text.muted}>{files().length}</text>
            </Show>
          </box>

          <Show when={changes.loading && files().length === 0}>
            <text fg={context.theme.text.muted}>Loading…</text>
          </Show>

          <Show when={changes.error && !changes.loading}>
            <text fg={context.theme.text.feedback.error.base}>Unable to load changes</text>
          </Show>

          <Show when={!changes.loading && !changes.error && files().length === 0}>
            <text fg={context.theme.text.muted}>No changes</text>
          </Show>

          <For each={files()}>
            {(file) => <FileRow context={context} file={file} onOpen={openFile} />}
          </For>
        </box>
      ),
    }),
  )
  onCleanup(
    context.client.rpc(SidebarChanges).events.on("changed", (event) => {
      if (event.location.directory !== directory()) return
      void refetch()
    }),
  )
  for (const type of ["filesystem.changed", "vcs.branch.updated"] as const) {
    onCleanup(
      context.data.on(type, (event) => {
        if (event.location?.directory && event.location.directory !== directory()) return
        void refetch()
      }),
    )
  }
  onCleanup(() => {
    if (selectionTimer) clearTimeout(selectionTimer)
    controller.abort()
  })

  return <DiffCloseButton context={context} />
}

export default Plugin.define({
  id: "local.sidebar-diff.tui",
  setup(context) {
    return context.ui.slot({ append: "app", render: () => <SidebarDiff context={context} /> })
  },
})
