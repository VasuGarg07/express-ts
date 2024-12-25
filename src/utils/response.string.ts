export const ERROR_STRINGS = {
    IncorrectPassword: "Password don't match. Please verify",
    UserNotFound: "User not found",
    InvalidCreds: "Invalid Credentials.",
    ServerError: "Internal server error. Something went wrong.",
    NoRefToken: "Refresh token is required",
    InvalidToken: "Invalid or expired refresh token",
    UnauthorizedAccess: "Unauthorized Access",

    // expenses
    InvalidTxnId: "Transaction ID is required and must be valid",
    TransactionNotFound: "Transaction not found",

    // blogs
    InvalidBlogId: "Blog ID is required is required and must be valid",
    BlogNotFound: "Blog not found",
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
    AllBlogsCleared: "All blogs have been cleared"
};
