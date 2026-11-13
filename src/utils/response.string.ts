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

};