type LessonIconProps = Readonly<{
  icon?: string | null;
}>;

export function LessonIcon({ icon }: LessonIconProps) {
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-lg ring-1 ring-primary/10">
      <span aria-hidden>{icon}</span>
    </div>
  );
}
