// Test: While loop
public class LoopProcessor
{
    public int Factorial(int n)
    {
        if (n <= 1)
        {
            return 1;
        }

        int result = 1;
        while (n > 1)
        {
            result *= n;
            n--;
        }

        return result;
    }
}