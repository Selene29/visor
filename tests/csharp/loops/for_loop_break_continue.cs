// Test: For loop with break and continue
public class LoopProcessor
{
    public List<int> ProcessNumbers(List<int> numbers)
    {
        var result = new List<int>();
        
        for (int i = 0; i < numbers.Count; i++)
        {
            int current = numbers[i];
            
            if (current < 0)
            {
                continue;
            }
            
            if (current > 100)
            {
                break;
            }
            
            result.Add(current * 2);
        }
        
        return result;
    }
}