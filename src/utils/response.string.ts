export const ERROR_STRINGS = {
    IncorrectPassword: "Password don't match. Please verify",
    UserNotFound: "User not found",
    InvalidCreds: "Invalid Credentials.",
    ServerError: "Internal server error. An unexpected error occurred.",
    NoRefToken: "Refresh token is required",
    InvalidToken: "Invalid or expired refresh token",
    UnauthorizedAccess: "Unauthorized Access",

    ForbiddenAction: "You do not have permission for this action",

    // expenses
    InvalidTxnId: "Transaction ID is required and must be valid",
    TransactionNotFound: "Transaction not found",

    // blogs
    InvalidBlogId: "Blog ID is required is required and must be valid",
    BlogNotFound: "Blog not found",

    // jobs
    ProfileNotFound: "Profile not found. Please register to begin using the application",
    InvalidRole: "Invalid role provided in the headers.",
    RoleNotFound: "Role is required in the headers.",
    ApplicantExists: "Applicant already exists.",
    EmployerExists: "Employer already exists.",
    JobNotFound: "Job for corresponding Id does not exist.",
    JobNotOwned: "Unauthorized access: You are not the owner of this job",
    ApplicationNotFound: "Application for this job is not found"
};

export const SUCCESS_STRINGS = {
    UserCreated: "User registered successfully",
    PasswordChanged: "Password changed successfully",
    TokenRefreshed: "Access token refreshed",

    // expenses
    TransactionAdded: "New Transaction added successfully",
    TranscationUpdated: "Transaction updated successfully",
    TransactionDeleted: "Transaction deleted successfully",

    // blogs
    BlogAdded: "Your blog has been published successfully",
    BlogUpdated: "Your blog has been updated",
    BlogArchived: "This blog has been archived",
    BlogDeleted: "This blog has been deleted",
    ArchivedBlogsCleared: "All archived blogs have been cleared",
    AllBlogsCleared: "All blogs have been cleared",

    // jobs
    ApplicantRegistered: "Applicant registered successfully.",
    EmployerRegistered: "Employer registered successfully.",
    ProfileUpdated: "Profile updated successfully.",
    ApplicantDeleted: "Applicant account and associated data deleted successfully.",
    EmployerDeleted: "Employer account and associated data deleted successfully.",
    JobPosted: "Job posted successfully",
    JobUpdated: "Job updated successfully",
    JobDeleted: "Job deleted successfully",
    ApplicationUpdated: "Job Application Updated"
};
