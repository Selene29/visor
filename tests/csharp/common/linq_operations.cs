// Test: LINQ and method chaining
using System.Linq;

public class DataProcessor
{
    public List<int> ProcessNumbers(List<int> numbers)
    {
        return numbers
            .Where(n => n > 0)
            .Where(n => n < 100)
            .Select(n => n * 2)
            .OrderBy(n => n)
            .ToList();
    }

    public string ProcessStrings(List<string> strings)
    {
        var result = strings
            .Where(s => !string.IsNullOrEmpty(s))
            .Select(s => s.Trim().ToUpper())
            .FirstOrDefault();
            
        return result ?? "No valid string found";
    }
}