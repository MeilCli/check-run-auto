import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHub } from "@actions/github/lib/utils";
import { getOption } from "./option";
import { setState } from "./state";

async function findCheckRun(
    client: InstanceType<typeof GitHub>,
    owner: string,
    repository: string,
    sha: string,
    name: string
): Promise<number | null> {
    const response = await client.checks.listForRef({ owner: owner, repo: repository, ref: sha, check_name: name });
    if (400 <= response.status) {
        core.info(`error founde! ${response.headers.status}`);
    }
    return response?.data?.check_runs?.find((x) => x.name == name)?.id ?? null;
}

export async function run(): Promise<number | null> {
    try {
        const option = getOption();
        const client = github.getOctokit(option.githubToken);
        const owner = option.repository.split("/")[0];
        const repository = option.repository.split("/")[1];
        core.info("find check run");
        const foundCheckRunId = await findCheckRun(client, owner, repository, option.sha, option.name);
        core.info(`found check run: ${foundCheckRunId != null}`);
        if (foundCheckRunId != null) {
            const response = await client.checks.update({
                owner: owner,
                repo: repository,
                check_run_id: foundCheckRunId,
                status: "in_progress",
                details_url: option.detailsUrl ?? undefined,
            });
            if (400 <= response.status) {
                throw new Error("cannot update check run");
            }
            setState({ checkRunId: foundCheckRunId, failed: false });
            core.info(`found check run updated`);
            return foundCheckRunId;
        } else {
            const response = await client.checks.create({
                owner: owner,
                repo: repository,
                name: option.name,
                head_sha: option.sha,
                status: "in_progress",
                details_url: option.detailsUrl ?? undefined,
            });
            if (400 <= response.status) {
                throw new Error("cannot create check run");
            }
            setState({ checkRunId: response.data.id, failed: false });
            core.info("check run created");
            return response.data.id;
        }
    } catch (error) {
        core.setFailed(error.message);
        setState({ checkRunId: null, failed: true });
    }
    return null;
}

run();
