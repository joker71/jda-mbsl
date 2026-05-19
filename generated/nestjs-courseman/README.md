# CourseMan NestJS Migration

This folder contains a generated TypeScript/NestJS migration of the Java CourseMan sample domain under:

`modules/mbsl/src/test/java/org/jda/example/courseman/modules`

The generated API keeps the Java `@DAttr` metadata as TypeScript schema and exposes a generic CRUD surface:

- `GET /courseman/schema`
- `GET /courseman/:resource`
- `GET /courseman/:resource/:id`
- `POST /courseman/:resource`
- `PATCH /courseman/:resource/:id`
- `DELETE /courseman/:resource/:id`

Example resources:

- `students`
- `course-modules`
- `sclasses`
- `sclass-registrations`
- `enrolments`
- `payments`
- `authorisations`
- `enrolment-approvals`
- `orientations`
- `help-requests`
- `enrolment-closures`

## Run

```bash
npm install
npm run start:dev
```

## Example

```bash
curl -X POST http://localhost:3000/courseman/students \
  -H 'content-type: application/json' \
  -d '{"name":"Nguyen Van A","helpRequested":false}'

curl -X POST http://localhost:3000/courseman/course-modules \
  -H 'content-type: application/json' \
  -d '{"name":"Software Engineering","semester":1,"credits":3}'
```

## Migration Notes

- The Java Swing/JDA framework layer is not ported. This is a NestJS API migration of the CourseMan domain model.
- Associations are represented as `...Id` and `...Ids` fields.
- Derived Java behavior currently implemented:
  - `CourseModule.code` generation from semester.
  - `Enrolment.finalMark` and `Enrolment.finalGrade`.
  - `EnrolmentApproval.approved` from payment and authorisation status.
- The storage layer is in-memory. Replace `ResourceStore` with TypeORM/Prisma repositories when you choose a database.
