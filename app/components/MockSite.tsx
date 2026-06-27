export type Mock = {
  paper: string;
  ink: string;
  accent: string;
  soft: string;
};

function Bar({
  w,
  h = 8,
  c,
  r = 4,
}: {
  w: number | string;
  h?: number;
  c: string;
  r?: number;
}) {
  return (
    <div
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: `${h}px`,
        background: c,
        borderRadius: `${r}px`,
      }}
    />
  );
}

export function MockSite({ m }: { m: Mock }) {
  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: m.paper }}
      aria-hidden
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: m.soft }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
        <div
          className="ml-3 h-4 flex-1 max-w-[180px] rounded-full"
          style={{ background: m.paper, opacity: 0.7 }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <Bar w={70} h={12} c={m.ink} />
          <div className="flex items-center gap-4">
            <Bar w={34} c={m.ink} />
            <Bar w={34} c={m.ink} />
            <Bar w={34} c={m.ink} />
            <div
              style={{
                width: "62px",
                height: "26px",
                background: m.accent,
                borderRadius: "999px",
              }}
            />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 items-center gap-7">
          <div className="flex flex-col gap-3.5">
            <Bar w="95%" h={24} c={m.ink} r={6} />
            <Bar w="70%" h={24} c={m.accent} r={6} />
            <div className="mt-1 flex flex-col gap-2">
              <Bar w="88%" c={m.soft} />
              <Bar w="74%" c={m.soft} />
            </div>
            <div className="mt-2">
              <div
                style={{
                  width: "120px",
                  height: "34px",
                  background: m.accent,
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>
          <div
            className="relative h-full min-h-[120px] overflow-hidden rounded-2xl"
            style={{ background: m.soft }}
          >
            <div
              className="absolute inset-x-5 bottom-5 h-1/2 rounded-xl"
              style={{ background: m.accent, opacity: 0.9 }}
            />
            <div
              className="absolute right-5 top-5 h-10 w-10 rounded-full"
              style={{ background: m.accent }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl p-4"
              style={{ background: m.soft }}
            >
              <div
                className="h-8 w-8 rounded-lg"
                style={{ background: m.accent, opacity: 0.85 }}
              />
              <Bar w="80%" c={m.ink} />
              <Bar w="60%" c={m.ink} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
