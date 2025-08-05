// Test: Email validation with complex logic
public class Validator
{
    public bool IsValidEmail(string email)
    {
        if (string.IsNullOrEmpty(email))
        {
            return false;
        }

        if (!email.Contains("@"))
        {
            return false;
        }

        string[] parts = email.Split('@');
        if (parts.Length != 2)
        {
            return false;
        }

        return !string.IsNullOrEmpty(parts[0]) && !string.IsNullOrEmpty(parts[1]);
    }
}