# Todo
This is in no way a priority list, just an itemized list of things needing to be done

## Admin Panel 

### 1. Categories page
- [ ] Show Products in Categories view modal
- [ ] Remove Root/Parent Category functionality
- [ ] Show amount of products in a category and allow sorting by that
- [ ] Stop fetching after every Category update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))

### 2. Orders Page
- [ ] Create view button that opens viewing modal
- [ ] Allow Order to have multiple products
- [ ] Allow Order to have multiple of a pruduct
- [ ] Show all products in order in view product
- [ ] Stop allowing changing of prices and items, only status
- [ ] Allow for sorting by order total
- [ ] Stop fetching after every Order update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))

### 3. Users Page
- [ ] Stop fetching after every User update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))
- [ ] In view modal, have button to show associated wishlists, orders, adresses, payment methods, and products

### 4. Products Page
- [ ] Allow for searching by category (filter, not typing search)
- [ ] Stop fetching after every Product update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))
- [ ] Implement sorting by price

### 5. Coupons page
- [ ] Stop fetching after every Coupon update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))
- [ ] Implement sorting by discount percentage, allow for filtering by discount percentage (lower than X, higher than Y)

### 6. Reviews page
- [ ] Stop fetching after every Review update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))
- [ ] Implement sorting by rating, allow filtering by ratings (lower than X, higher than Y)

### 7. Payment page
- [ ] Implement Stripe payments, we dont have to manage these

### 8. Addresses page
- [ ] Stop fetching after every Address update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))
- [ ] Implement sorting by country, allow for filtering by country

### 9. Wishlists page
- [ ] Allow wishlists to have multiple products
- [ ] Stop fetching after every Wishlist update or create, only on delete
- [ ] Implement debounce on the searching to avoid spam requests
- [ ] Implement sorting from old to new, and from new to old (db request (new request parameter))
- [ ] Implement sorting by name, allow for filtering by name

### 10. Cart (no page, just backend)
- [ ] Allow carts to have multiple products
- [ ] Allow carts to have multiple of the same product
- [ ] Allow for removing products from cart
- [ ] Allow for updating quantity of products in cart
- [ ] ALlow for adding coupon (single) to a cart and recalculating total

## User facing

### 11. Home page
- [ ] Allow for getting the card when logging in
- [ ] Add featured products (latest 3 to be added to store)
- [ ] Add carousel of products (all products)

### 12. Categories page
- [ ] Show all categories and the amount of products in them
- [ ] When clicked navigate to products page filtered by the category

### 13. Products page
- [ ] Show all products in a grid or list (user choice)
- [ ] Show product name, price, and image
- [ ] Add sorting to the top of the grid
- [ ] Add filters and searching to the left side of the grid
- [ ] Allow for adding products to cart
- [ ] When filtered by a category, show category in small hero section
- [ ] Add pagination and allow user to choose amount per page
#### 13.1. Product page
- [ ] Show product name, price, image, and description
- [ ] Show amount of products in stock
- [ ] Add to cart button
- [ ] Add to wishlist button
- [ ] Add to reviews button

### 14. Cart page
- [ ] Show cart items
- [ ] Show total price
- [ ] Show coupon (if any)
- [ ] Show estimated total price after coupon (if any)
- [ ] Allow for adding coupon to cart
- [ ] Allow for removing coupon from cart
- [ ] Allow for updating quantity of products in cart
- [ ] Allow for removing products from cart
- [ ] Allow for adding products to cart
- [ ] Allow for checking out cart
- [ ] Allow for emptying cart
- [ ] Allow for updating cart
- [ ] Allow for getting cart

### 15. Our Team page
- [ ] Add a navbar under regular navbar with entries for roster, schedule, results etc.
- [ ] Add landing page with an about us section and a recent tweets section (can be changed later)
#### 15.1. Roster page
- [ ] Show all team members and their positions (engineer, driver, management etc)
- [ ] Show team member image, name, position, and social media links
#### 15.2. Schedule page
- [ ] Show all team races and their times
- [ ] Show team name, competition, and time
#### 15.3. Results page
- [ ] Show all team results and their positions
- [ ] Show team name, position, and points earned
#### 15.4. Contact page
- [ ] Add a contact form with fields for name, email, subject, and message
- [ ] Add a submit button to send the form
- [ ] Add a success message after the form is submitted

### 16. Wishlists page
- [ ] Show all of the users wishlists and their names
- [ ] Show wishlist name, and amount of products in it
- [ ] Show products in wishlist
- [ ] Add a button to create a new wishlist
- [ ] Add a button to delete a wishlist
#### 16.1. Wishlist products page
- [ ] Show all products in wishlist
- [ ] Show product name, price, and image
- [ ] Add a button to add a product to a wishlist
- [ ] Add a button to remove a product from a wishlist

### 17. Profile page
- [ ] Show user name, email, and role
- [ ] Show wishlists
- [ ] Show orders
- [ ] Show addresses
- [ ] Show payment methods
- [ ] Show products
#### 17.1. Order page
- [ ] Show all of the users orders and their status
- [ ] Show order number, date, and status
- [ ] Show products in order
- [ ] Show total price
- [ ] Show coupon (if any)
- [ ] Show estimated total price after coupon (if any)
- [ ] Show payment method
- [ ] Show shipping address
- [ ] Show billing address
#### 17.2. Address page
- [ ] Show all of the users addresses
- [ ] Show address type, country, city, street, and zip code
- [ ] Add a button to create a new address
- [ ] Add a button to delete an address