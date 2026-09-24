"use client";

import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import type { AdminLessonVersion } from "@/lib/admin-lessons";
import {
  Clock3,
  History,
  UserRound,
} from "lucide-react";

type LessonVersionHistoryProps = {
  versions: AdminLessonVersion[];
};

function formatPublishedAt(
  value: string,
  language: string,
): string {
  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(parsed);
}

export default function LessonVersionHistory({
  versions,
}: LessonVersionHistoryProps) {
  const {
    t,
    language,
  } = useLanguage();

  const orderedVersions =
    [...versions].sort(
      (a, b) =>
        b.versionNumber -
        a.versionNumber,
    );

  return (
    <AdminSectionCard
      title={t(
        "admin.lessons.history.title",
      )}
      description={t(
        "admin.lessons.history.description",
      )}
    >
      {orderedVersions.length ===
      0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          {t(
            "admin.lessons.history.empty",
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {orderedVersions.map(
            (version) => (
              <article
                key={
                  version.id
                }
                className="rounded-2xl border border-border/50 bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <History className="h-4 w-4" />
                    </span>

                    <span
                      dir="ltr"
                      className="font-black text-foreground"
                    >
                      V
                      {
                        version.versionNumber
                      }
                    </span>
                  </div>

                  <Badge variant="outline">
                    {
                      version.source
                    }
                  </Badge>
                </div>

                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {formatPublishedAt(
                        version.publishedAt,
                        language,
                      )}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {version.publishedByUserId ===
                      null
                        ? t(
                            "admin.lessons.history.system_publisher",
                          )
                        : t(
                            "admin.lessons.history.publisher",
                          ) +
                          " #" +
                          version.publishedByUserId}
                    </span>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
                  {version.changeNote?.trim() ||
                    t(
                      "admin.lessons.history.no_change_note",
                    )}
                </p>
              </article>
            ),
          )}
        </div>
      )}
    </AdminSectionCard>
  );
}
