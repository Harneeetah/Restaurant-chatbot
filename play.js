 const meals = [ 
    [
    {name: "jollof rice", price: 500},
    {name: "beans", price: 100},
    {name: "beef", price: 50}
    ],
    [
    {name: "beans", price: 100},
    {name: "beef", price: 50}
    ],
    [
     {name: "beef", price: 50}
    ]
]


const totalPrice = meals.reduce((total, category) => {
  // Validate that category is an array
  if (!Array.isArray(category)) {
    console.warn('Invalid category (not an array):', category);
    return total;
  }

  const categoryTotal = category.reduce((sum, meal) => {
    // Check if meal has a valid price
    if (typeof meal?.price !== 'number') {
      console.warn('Invalid meal price:', meal);
      return sum;
    }
    return sum + meal.price;
  }, 0);

  return total + categoryTotal;
}, 0);
console.log(totalPrice);