import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOption, getOptionOutput } from "./option";
import { getState, setState } from "./state";

async function run() {
    const state = getState();
    try {
        const option = getOption();
        const optionOutput = getOptionOutput();
        if (state.checkRunId == null || state.failed) {
            throw new Error("found some error on pre action");
        }
        const client = github.getOctokit(option.githubToken);
        const owner = option.repository.split("/")[0];
        const repository = option.repository.split("/")[1];
        const response = await client.checks.update({
            owner: owner,
            repo: repository,
            check_run_id: state.checkRunId,
            output: {
                title: optionOutput.title,
                summary: optionOutput.surmmary,
                text: optionOutput.text ?? undefined,
            },
        });
        if (400 <= response.status) {
            throw new Error("cannot update check run");
        }
        core.setOutput("check_run_id", `${state.checkRunId}`);
    } catch (error) {
        core.setFailed(error.message);
        setState({ checkRunId: state.checkRunId, failed: true });
    }
}

run();
