// Maps each API's raw job shape to one common format.
// Every source goes through here before being filtered or displayed.

export function fromSiliconHarbour(job) {
  return {
    id:            `sh-${job.id}`,
    title:         job.title ?? "",
    company:       job.companyName ?? "",
    location:      job.location ?? "",
    workplaceType: job.workplaceType ?? "",
    salary:        job.salaryRange ?? null,
    postedAt:      job.postedAt ?? job.createdAt,
    url:           job.url ?? job.detailUrl ?? "",
    source:        "Silicon Harbour",
  };
}

export function fromJobicy(job) {
  return {
    id:            `jc-${job.id}`,
    title:         job.jobTitle ?? "",
    company:       job.companyName ?? "",
    location:      job.jobGeo ?? "",
    workplaceType: "Remote",
    salary:        job.salaryMin ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}` : null,
    postedAt:      job.pubDate,
    url:           job.url ?? "",
    source:        "Jobicy",
  };
}
