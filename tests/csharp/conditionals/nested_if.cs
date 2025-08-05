// Test: Nested if statements
public class Logic
{
    public string Categorize(int number)
    {
        if (number > 0)
        {
            if (number > 100)
            {
                return "Large Positive";
            }
            else
            {
                return "Small Positive";
            }
        }
        else if (number < 0)
        {
            return "Negative";
        }
        else
        {
            return "Zero";
        }
    }
}