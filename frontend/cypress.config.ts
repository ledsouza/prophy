import { defineConfig } from "cypress";

export default defineConfig({
    component: {
        devServer: {
            framework: "next",
            bundler: "webpack",
        },
    },

    e2e: {
        baseUrl: "http://localhost:3000",
        setupNodeEvents(on, config) {
            on("task", {
                "db:seed": async () => {
                    const baseUrl = config.env.apiUrl || "http://localhost:8000/api";
                    const cypressManageUrl = `${baseUrl.replace(/\/$/, "")}/../__cypress__/manage/`;
                    const csrfUrl = `${baseUrl.replace(/\/$/, "")}/../__cypress__/csrftoken/`;

                    const fetchCsrfToken = async (): Promise<string> => {
                        const res = await fetch(csrfUrl, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });

                        if (!res.ok) {
                            const text = await res.text();
                            throw new Error(
                                `django_cypress csrftoken failed: ${res.status} ${text}`
                            );
                        }

                        const setCookieHeader = res.headers.get("set-cookie") || "";
                        const match = setCookieHeader.match(/csrftoken=([^;]+)/);
                        if (!match) {
                            throw new Error(
                                "django_cypress csrftoken did not set csrftoken cookie"
                            );
                        }

                        return match[1];
                    };

                    const manage = async (
                        command: string,
                        parameters: string[] = []
                    ): Promise<void> => {
                        const csrfToken = await fetchCsrfToken();
                        const res = await fetch(cypressManageUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": csrfToken,
                                Cookie: `csrftoken=${csrfToken}`,
                            },
                            body: JSON.stringify({
                                command,
                                parameters,
                            }),
                        });

                        if (!res.ok) {
                            const text = await res.text();
                            throw new Error(`django_cypress manage failed: ${res.status} ${text}`);
                        }
                    };

                    await manage("flush", ["--no-input"]);
                    await manage("populate", []);

                    return null;
                },
            });
        },
    },

    env: {
        apiUrl: "http://localhost:8000/api",
    },
});
