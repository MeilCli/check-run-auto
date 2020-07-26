import * as core from "@actions/core";

export interface Option {
    githubToken: string;
    repository: string;
    sha: string;
    name: string;
    detailsUrl: string | null;
    result: string | null;
}

export interface OptionOutput {
    title: string;
    surmmary: string;
    text: string | null;
}

export function getOption(): Option {
    return {
        githubToken: getInput("github_token"),
        repository: getInput("repository"),
        sha: getInput("sha"),
        name: getInput("name"),
        detailsUrl: getInputOrNull("details_url"),
        result: getInputOrNull("result"),
    };
}

export function getOptionOutput(): OptionOutput {
    return {
        title: getInput("output_title"),
        surmmary: getInput("output_surmmary"),
        text: getInputOrNull("output_text"),
    };
}

function getInput(key: string): string {
    return core.getInput(key, { required: true });
}

function getInputOrNull(key: string): string | null {
    const result = core.getInput(key, { required: false });
    if (result.length == 0) {
        return null;
    }
    return result;
}
