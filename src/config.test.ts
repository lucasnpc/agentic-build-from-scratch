import { loadConfig } from "./config";

describe("loadConfig", () => {
  it("uses safe defaults when env is empty", () => {
    const cfg = loadConfig({} as NodeJS.ProcessEnv);
    expect(cfg.port).toBe(3000);
    expect(cfg.logLevel).toBe("info");
    expect(cfg.nodeEnv).toBe("development");
  });

  it("respects PORT and LOG_LEVEL from env", () => {
    const cfg = loadConfig({
      PORT: "4321",
      LOG_LEVEL: "debug",
      NODE_ENV: "production",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg.port).toBe(4321);
    expect(cfg.logLevel).toBe("debug");
    expect(cfg.nodeEnv).toBe("production");
  });

  it("throws on an invalid LOG_LEVEL", () => {
    expect(() =>
      loadConfig({ LOG_LEVEL: "loud" } as unknown as NodeJS.ProcessEnv)
    ).toThrow();
  });
});
