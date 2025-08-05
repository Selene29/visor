// Test: Generic methods and type constraints
public class GenericProcessor<T> where T : IComparable<T>
{
    public T FindMax(List<T> items)
    {
        if (items == null || items.Count == 0)
        {
            throw new ArgumentException("List cannot be null or empty");
        }
        
        T max = items[0];
        
        for (int i = 1; i < items.Count; i++)
        {
            if (items[i].CompareTo(max) > 0)
            {
                max = items[i];
            }
        }
        
        return max;
    }
    
    public List<T> FilterAndSort(List<T> items, Func<T, bool> predicate)
    {
        var filtered = new List<T>();
        
        foreach (var item in items)
        {
            if (predicate(item))
            {
                filtered.Add(item);
            }
        }
        
        filtered.Sort();
        return filtered;
    }
}