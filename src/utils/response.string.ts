export const ERROR_STRINGS = {
    // Auth
    IncorrectPassword: "Password doesn't match. Please verify and try again",
    UserNotFound: "User not found",
    InvalidCreds: "Invalid credentials",
    ServerError: "An unexpected error occurred. Please try again later",
    NoRefToken: "Refresh token is required",
    InvalidToken: "Invalid or expired refresh token",
    UnauthorizedAccess: "Unauthorized access",
    ForbiddenAction: "You do not have permission for this action",

    // Expenses
    InvalidTxnId: "Transaction ID is required and must be valid",
    TransactionNotFound: "Transaction not found",

    // Blogs
    InvalidBlogId: "Blog ID is required and must be valid",
    BlogNotFound: "Blog not found",
    InvalidNotebookId: "Notebook ID is required and must be valid",
    NotebookNotFound: "Notebook not found",

    // Jobs
    ProfileNotFound: "Profile not found. Please register to begin",
    InvalidRole: "Invalid role provided in headers",
    RoleNotFound: "Role is required in headers",
    ApplicantExists: "Applicant already exists",
    EmployerExists: "Employer already exists",
    JobNotFound: "Job not found",
    JobNotOwned: "You are not the owner of this job",
    ApplicationNotFound: "Application not found",
    CompanyNotFound: "Company details not found",
    ApplicationExists: "You have already applied for this job",
    NoJobsForApplications: "No jobs found for the given applications",
    JobAlreadySaved: "Job is already saved",
    NoApplicant: "Applicant not found",

    // Form Builder
    InvalidFormId: "Form ID is required and must be valid",
    FormNotFound: "Form not found",
    FormNotOwned: "You are not the owner of this form",
    FormInactive: "This form is no longer active",
    InvalidFormConfig: "Invalid form configuration",
    InvalidFormResponse: "Invalid form response data",
    ResponseNotFound: "Form response not found",
    FormValidationFailed: "Form validation failed",
    ResponseSubmissionFailed: "Failed to submit form response",
    MaxFormsReached: "Maximum number of forms reached",
    InvalidFieldType: "Invalid field type provided",
    DuplicateKeys: "Duplicate keys found in form structure",
    FormLimitExceeded: "Form structure exceeds allowed limits",
    InvalidFormStructure: "Invalid form structure provided",
    FormExportFailed: "Failed to export form configuration",
    FormImportFailed: "Failed to import form configuration",
};

export const SUCCESS_STRINGS = {
    // Auth
    UserCreated: "User registered successfully",
    PasswordChanged: "Password changed successfully",
    TokenRefreshed: "Access token refreshed",

    // Expenses
    TransactionAdded: "Transaction added successfully",
    TranscationUpdated: "Transaction updated successfully",
    TransactionDeleted: "Transaction deleted successfully",

    // Blogs
    BlogAdded: "Blog published successfully",
    BlogUpdated: "Blog updated successfully",
    BlogArchived: "Blog archived successfully",
    BlogDeleted: "Blog deleted successfully",
    BlogMoved: "Blog moved successfully",
    ArchivedBlogsCleared: "All archived blogs cleared",
    AllBlogsCleared: "All blogs cleared",
    NotebookCreated: "Notebook created successfully",
    NotebookUpdated: "Notebook updated successfully",
    NotebookDeleted: "Notebook deleted successfully",

    // Jobs
    ApplicantRegistered: "Applicant registered successfully",
    EmployerRegistered: "Employer registered successfully",
    ProfileUpdated: "Profile updated successfully",
    ApplicantDeleted: "Applicant account deleted successfully",
    EmployerDeleted: "Employer account deleted successfully",
    JobPosted: "Job posted successfully",
    JobUpdated: "Job updated successfully",
    JobDeleted: "Job deleted successfully",
    ApplicationUpdated: "Application updated successfully",
    ApplicationSubmitted: "Application submitted successfully",
    NoApplications: "No applications found",
    JobSaved: "Job saved successfully",

    // Form Builder
    FormCreated: "Form created successfully",
    FormUpdated: "Form updated successfully",
    FormDeleted: "Form deleted successfully",
    FormSaved: "Form saved successfully",
    FormActivated: "Form activated successfully",
    FormDeactivated: "Form deactivated successfully",
    FormDuplicated: "Form duplicated successfully",
    ResponseSubmitted: "Response submitted successfully",
    ResponseDeleted: "Response deleted successfully",
    FormExported: "Form exported successfully",
    FormImported: "Form imported successfully",
};