const pool = require("../db/pool");
const { z } = require("zod");

const applicationSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  job_title: z.string().min(1, "Job title is required"),
  job_url: z.string().url().optional().or(z.literal("")),
  date_applied: z.string().optional(),
  status: z
    .enum([
      "draft",
      "applied",
      "interviewing",
      "offered",
      "rejected",
      "withdrawn",
    ])
    .optional(),
  notes: z.string().optional(),
});

// this hits the db and select every row from the applictions table
// orders by newsest first
// returns json format

const getAllApplications = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM applications ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createApplication = async (req, res, next) => {
  try {
    // TODO: Validate with applicationSchema.safeParse() -- this is done!
    // TODO: INSERT and return new row with 201 - this is done!

    const parsed = applicationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }

    // here is the insert to application
    // the dollar sign stuff is a secruity habit
    // this all using zod - pdf in docs to explain better

    const result = await pool.query(
      `INSERT INTO applications (company_name, job_title, job_url, date_applied, status, notes)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *`,
      [
        parsed.data.company_name,
        parsed.data.job_title,
        parsed.data.job_url,
        parsed.data.date_applied,
        parsed.data.status,
        parsed.data.notes,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateApplication = async (req, res, next) => {
  try {
    // TODO: Validate with applicationSchema.safeParse()
    // TODO: UPDATE by req.params.id, return 404 if not found
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    // TODO: DELETE by req.params.id, return 404 if not found, 204 on success
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
};
