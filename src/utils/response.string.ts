export const ERROR_STRINGS = {
    // Auth & General
    IncorrectPassword: "The password you entered is incorrect. Please try again.",
    UserNotFound: "User account not found.",
    InvalidCreds: "Invalid login credentials. Please check and try again.",
    ServerError: "Something went wrong on our end. Please try again later.",
    NoRefToken: "A refresh token is required but was not provided.",
    InvalidToken: "Your session has expired or the token is invalid.",
    UnauthorizedAccess: "You must be logged in to access this resource.",
    ForbiddenAction: "You don't have permission to perform this action.",

    // Expenses
    InvalidTxnId: "A valid transaction ID is required.",
    TransactionNotFound: "No transaction found with the given ID.",

    // Blogs
    InvalidBlogId: "A valid blog ID is required.",
    BlogNotFound: "The requested blog could not be found.",

    // Jobs
    ProfileNotFound: "Profile not found. Please complete registration.",
    InvalidRole: "Invalid role specified in the request headers.",
    RoleNotFound: "User role is required in the request headers.",
    ApplicantExists: "An applicant profile already exists for this user.",
    EmployerExists: "An employer profile already exists for this user.",
    JobNotFound: "No job found with the specified ID.",
    JobNotOwned: "You are not authorized to modify this job.",
    ApplicationNotFound: "No job application found for the given data.",
    CompanyNotFound: "Company details could not be found.",
    ApplicationExists: "You have already applied to this job.",
    NoJobsForApplications: "No jobs found for the listed applications.",
    JobAlreadySaved: "You’ve already saved this job.",
    NoApplicant: "Applicant profile could not be found.",

    // Notebooks
    NotebookNotFound: "Notebook not found.",
    InvalidNotebookId: "A valid notebook ID is required.",
    NotebookNotOwned: "You do not have permission to modify this notebook.",
    PasswordRequired: "Password is required to access this private notebook.",
    PasswordTooShort: "Password must be at least 4 characters long.",
    IncorrectNotebookPassword: "Incorrect password. Please try again.",

    // Chapters
    ChapterNotFound: "Chapter not found.",
    InvalidChapterId: "A valid chapter ID is required.",
    ChapterNotOwned: "You do not have permission to modify this chapter.",
};

export const SUCCESS_STRINGS = {
    // Auth
    UserCreated: "Account created successfully.",
    PasswordChanged: "Your password has been updated.",
    TokenRefreshed: "Access token refreshed successfully.",

    // Expenses
    TransactionAdded: "Transaction added successfully.",
    TranscationUpdated: "Transaction updated successfully.",
    TransactionDeleted: "Transaction deleted successfully.",

    // Blogs
    BlogAdded: "Your blog has been published.",
    BlogUpdated: "Your blog has been updated.",
    BlogArchived: "This blog has been archived.",
    BlogDeleted: "The blog has been permanently deleted.",
    ArchivedBlogsCleared: "All archived blogs have been removed.",
    AllBlogsCleared: "All blogs have been deleted.",

    // Jobs
    ApplicantRegistered: "Applicant profile created successfully.",
    EmployerRegistered: "Employer profile created successfully.",
    ProfileUpdated: "Profile updated successfully.",
    ApplicantDeleted: "Applicant account and data deleted.",
    EmployerDeleted: "Employer account and data deleted.",
    JobPosted: "Job posted successfully.",
    JobUpdated: "Job updated successfully.",
    JobDeleted: "Job deleted successfully.",
    ApplicationUpdated: "Application updated successfully.",
    ApplicationSubmitted: "Application submitted successfully.",
    NoApplications: "No applications found.",
    JobSaved: "Job saved to your list.",

    // Notebooks
    NotebookCreated: "Notebook created successfully.",
    NotebookUpdated: "Notebook updated successfully.",
    NotebookDeleted: "Notebook deleted successfully.",
    NotebookExported: "Notebook exported successfully.",
    PasswordVerified: "Password verified. Access granted.",
    Bookmarked: "Notebook bookmarked.",
    BookmarkRemoved: "Notebook removed from bookmarks",

    // Chapters
    ChapterCreated: "Chapter added to notebook.",
    ChapterUpdated: "Chapter updated successfully.",
    ChapterDeleted: "Chapter deleted successfully.",
    ChaptersDeleted: "Selected chapters have been deleted.",
};
