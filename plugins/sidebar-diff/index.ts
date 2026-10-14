import { execFile } from "node:child_process"
import { watch, type FSWatcher } from "node:fs"
import path from "node:path"
import { promisify } from "node:util"
import { Plugin } from "@opencode/plugin"
import { SidebarChanges } from "./rpc"

export default Plugin.define({
  id: "mdc-git.sidebar-diff",
  async setup(context) {
    const root = context.location.project.directory
    const repository = await promisify(execFile)(
      "git",
      ["rev-parse", "--path-format=absolute", "--git-dir", "--git-common-dir"],
      { cwd: root },
    ).catch((error: NodeJS.ErrnoException) => {
      if (Number(error.code) === 128) return undefined
      throw error
    })
    if (!repository) return

    const registration = await context.rpc.register(SidebarChanges, {})
    const emit = () => void registration.events.emit("changed", {}).catch(console.error)
    const watchers: FSWatcher[] = []
    try {
      watchers.push(
        watch(root, { recursive: true }, (_event, filename) => {
          if (filename?.split(path.sep).some((part) => part === ".git" || part === "node_modules")) return
          emit()
        }).on("error", console.error),
      )
      for (const directory of new Set(repository.stdout.trim().split("\n"))) {
        watchers.push(
          watch(directory, { recursive: true }, (_event, filename) => {
            if (
              filename === "HEAD" ||
              filename === "index" ||
              filename === "packed-refs" ||
              filename?.startsWith(`refs${path.sep}`)
            ) emit()
          }).on("error", console.error),
        )
      }
    } catch (error) {
      for (const watcher of watchers) watcher.close()
      throw error
    }

    return () => {
      for (const watcher of watchers) watcher.close()
    }
  },
})
