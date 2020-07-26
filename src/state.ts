import * as core from "@actions/core";

export interface State {
    checkRunId: number | null;
    failed: boolean;
}

export function getState(): State {
    const checkRunId = core.getState("check_run_id");
    return {
        checkRunId: checkRunId.length == 0 ? null : parseInt(checkRunId),
        failed: core.getState("failed") == "true",
    };
}

export function setState(state: State) {
    core.saveState("check_run_id", `${state.checkRunId ?? ""}`);
    core.saveState("failed", state.failed ? "true" : "false");
}
