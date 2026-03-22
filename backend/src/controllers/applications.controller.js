const { request } = require("express");
const pool = require("../db/pool");
const { z, safeParse } = require("zod");

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

// adding new  line here
// this reads the x-device-id header sent by the frontend on every request.

// this identifies the user's device so each user only sees their own rows.
// falls back to "unknown" if no header is present so the app doesn't crash.

const getDeviceId = (req) => req.headers["x-device-id"] || "unknown";

// this hits the db and select every row from the applictions table
// orders by newsest first
// returns json format

const getAllApplications = async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const result = await pool.query(
      "SELECT * FROM applications WHERE device_id = $1 ORDER BY created_at DESC",
      [deviceId],
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

    const deviceId = getDeviceId(req);
    const result = await pool.query(
      `INSERT INTO applications (company_name, job_title, job_url, date_applied, status, notes, device_id)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *`,
      [
        parsed.data.company_name,
        parsed.data.job_title,
        parsed.data.job_url,
        parsed.data.date_applied,
        parsed.data.status || "draft",
        parsed.data.notes,
        deviceId,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateApplication = async (request, response, next) => {
  const { id } = request.params;
  const parsedData = applicationSchema.safeParse(request.body);

  try {
    // checking if parsedDate is true or false with .success, returns an error if false
    if (!parsedData.success) {
      return response.status(400).json({ errors: parsedData.error.errors });
    }

    // update query to change/update data on an application
    const deviceId = getDeviceId(request);
    const result = await pool.query(
      `UPDATE applications 
   SET company_name = $1, job_title = $2, job_url = $3, date_applied = $4, status = $5, notes = $6 
   WHERE id = $7 AND device_id = $8 RETURNING *`,
      [
        parsedData.data.company_name,
        parsedData.data.job_title,
        parsedData.data.job_url,
        parsedData.data.date_applied,
        parsedData.data.status || "draft",
        parsedData.data.notes,
        id,
        deviceId,
      ],
    );
    // if rowCount is less then 1 return an error
    if (result.rowCount < 1) {
      s;
      return response
        .status(404)
        .json({ error: `No application with that id found.` });
    }
    // if all parameters are met return a status code 200, request seccessful.
    return response.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (request, response, next) => {
  const { id } = request.params;
  // checking to make sure the ID is in a valid UUID format.
  const parsedId = z.string().uuid().safeParse(id);

  // checkin g if parsedId is true or false with .success, return an error if false.
  if (!parsedId.success) {
    return response.status(400).json({ error: "Invalid Id format" });
  }

  try {
    // DELETE query to remove the selected POSTED application form the app.
    const deviceId = getDeviceId(request);
    const result = await pool.query(
      "DELETE FROM applications WHERE id = $1 AND device_id = $2",
      [id, deviceId],
    );
    // if rowCount  is less then 1 return an error, "Aplication not found."
    if (result.rowCount < 1) {
      return response.status(404).json({ error: "Aplication not found." });
    }
    // if all parameters are met return a status code 200, request successful.
    return response
      .status(200)
      .json({ message: "Application deleted seccueefully" });
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
