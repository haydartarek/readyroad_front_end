import { redirect } from "next/navigation";

export default async function ExamIndexPage({
  params,
}: {
  params: Promise<{ signCode: string }>;
}) {
  const { signCode } = await params;
  redirect(`/traffic-signs/${signCode}/exam/1`);
}
