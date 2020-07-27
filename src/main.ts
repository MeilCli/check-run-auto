import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOption, getOptionOutput } from "./option";
import { getState } from "./state";
import { run as preRun } from "./pre";

const conclusionList = [
    "success",
    "failure",
    "neutral",
    "cancelled",
    "skipped",
    "timed_out",
    "action_required",
] as const;
type Conclusion = typeof conclusionList[number];

async function run() {
    const checkRunId = await preRun();
    try {
        const state = getState();
        const option = getOption();
        const optionOutput = getOptionOutput();
        if (checkRunId == null) {
            throw new Error("found some error on pre action, check run is null");
        }
        if (state.failed) {
            throw new Error("found some error on pre action, pre action is failed");
        }
        const client = github.getOctokit(option.githubToken);
        const owner = option.repository.split("/")[0];
        const repository = option.repository.split("/")[1];
        const conclusion: Conclusion = conclusionList.find((x) => x == option.result) ?? "success";
        const response = await client.checks.update({
            owner: owner,
            repo: repository,
            check_run_id: checkRunId,
            output: {
                title: optionOutput.title,
                summary: optionOutput.surmmary,
                text: optionOutput.text ?? undefined,
            },
            status: "completed",
            conclusion: state.failed ? "failure" : conclusion,
        });
        if (400 <= response.status) {
            throw new Error("cannot update check run");
        }
        core.setOutput("check_run_id", `${checkRunId}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
