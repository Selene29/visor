// Test: Constructor and property initialization
public class Customer
{
    public string Name { get; set; }
    public int Age { get; set; }
    public bool IsActive { get; set; }
    
    public Customer(string name, int age)
    {
        if (string.IsNullOrEmpty(name))
        {
            throw new ArgumentException("Name cannot be empty");
        }
        
        if (age < 0)
        {
            throw new ArgumentException("Age cannot be negative");
        }
        
        Name = name;
        Age = age;
        IsActive = true;
    }
    
    public void DeactivateIfOld()
    {
        if (Age > 65)
        {
            IsActive = false;
        }
    }
}