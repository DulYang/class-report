import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getCoaches,
  getCurricula,
  getGrades,
  getLessonPlans,
  getSchools,
  getStudents,
} from "@/lib/data/queries";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    href: "/admin/schools",
    label: "Schools & Grades",
    blurb:
      "School details, person in charge, the grades it runs, and which coach owns each grade.",
  },
  {
    href: "/admin/coaches",
    label: "Coaches",
    blurb: "Who coaches, and who else is an admin.",
  },
  {
    href: "/admin/students",
    label: "Students",
    blurb: "The roster. A student belongs to a school and a grade.",
  },
  {
    href: "/admin/curriculum",
    label: "Curriculum",
    blurb: "Lesson plans per grade, with the assessment objectives for each.",
  },
  {
    href: "/admin/syllabus",
    label: "Syllabus",
    blurb: "Schedule a school's lesson plans onto dates coaches will teach.",
  },
];

export default async function AdminHome() {
  const admin = await requireAdmin();

  let counts = {
    schools: 0,
    grades: 0,
    coaches: 0,
    curricula: 0,
    plans: 0,
    students: 0,
  };
  let error: string | null = null;
  try {
    const [schools, grades, coaches, curricula, plans, students] =
      await Promise.all([
        getSchools(),
        getGrades(),
        getCoaches(),
        getCurricula(),
        getLessonPlans(),
        getStudents(),
      ]);
    counts = {
      schools: schools.length,
      grades: grades.length,
      coaches: coaches.length,
      curricula: curricula.length,
      plans: plans.length,
      students: students.length,
    };
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown database error";
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-neutral-600">
          Signed in as {admin.name}. Coaches cannot reach any of these screens.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
        >
          <p className="font-semibold">Could not load the admin summary</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Schools" value={counts.schools} />
          <Stat label="Grades" value={counts.grades} />
          <Stat label="Coaches" value={counts.coaches} />
          <Stat label="Curricula" value={counts.curricula} />
          <Stat label="Lesson plans" value={counts.plans} />
          <Stat label="Students" value={counts.students} />
        </dl>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
          >
            <p className="font-semibold">{card.label}</p>
            <p className="mt-1 text-sm text-neutral-600">{card.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}
