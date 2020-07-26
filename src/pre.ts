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
    return response?.data?.check_runs?.find((x) => x.name == name)?.id ?? null;
}

async function run() {
    try {
        const option = getOption();
        const client = github.getOctokit(option.githubToken);
        const owner = option.repository.split("/")[0];
        const repository = option.repository.split("/")[1];

        const foundCheckRunId = await findCheckRun(client, owner, repository, option.sha, option.name);
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
        }
    } catch (error) {
        core.setFailed(error.message);
        setState({ checkRunId: null, failed: true });
    }
}

run();
