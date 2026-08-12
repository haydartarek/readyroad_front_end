import { formatSettingValue, statusTone, taskCount } from "./marketing-admin";

describe("marketing admin helpers", () => {
  it("reads missing task counters as zero", () => {
    expect(taskCount({ COMPLETED: 4 }, "FAILED")).toBe(0);
    expect(taskCount({ COMPLETED: 4 }, "COMPLETED")).toBe(4);
  });

  it("maps operational states to stable tones", () => {
    expect(statusTone("COMPLETED")).toBe("success");
    expect(statusTone("FAILED")).toBe("danger");
    expect(statusTone("WAITING_APPROVAL")).toBe("warning");
    expect(statusTone("RUNNING")).toBe("default");
  });

  it("formats non-secret agent settings without losing structured values", () => {
    expect(formatSettingValue("Europe/Brussels")).toBe("Europe/Brussels");
    expect(formatSettingValue({ intervalDays: 3 })).toBe('{"intervalDays":3}');
    expect(formatSettingValue(null)).toBe("—");
  });
});
