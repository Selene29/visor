// Test: Properties with getters and setters
public class PropertyTester
{
    private int _age;

    public int Age
    {
        get
        {
            return _age;
        }
        set
        {
            if (value >= 0)
            {
                _age = value;
            }
            else
            {
                throw new ArgumentException("Age cannot be negative");
            }
        }
    }

    public string Name { get; set; }
}