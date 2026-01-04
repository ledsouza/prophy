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

                    const manage = async (
                        command: string,
                        parameters: string[] = []
                    ): Promise<void> => {
                        const res = await fetch(cypressManageUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
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
