// assets/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const burger = document.querySelector('.navbar-burger');
  const menu = document.querySelector('.navbar-menu');
  
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-active');
    menu.classList.toggle('is-active');
  });
  
  // Product image gallery
  const mainImage = document.querySelector('.product-main-image img');
  const thumbnails = document.querySelectorAll('.product-thumbnails img');
  
  if (mainImage && thumbnails.length > 0) {
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        mainImage.src = thumb.src.replace('-thumb', '');
        mainImage.alt = thumb.alt;
        
        // Add active class to selected thumbnail
        thumbnails.forEach(t => t.parentElement.classList.remove('is-active'));
        thumb.parentElement.classList.add('is-active');
      });
    });
  }
  
  // Foxy Cart ready event
  if (typeof FC === 'object') {
    FC.onReady(() => {
      // Update cart count
      updateCartCount();
      
      // Listen for cart update events
      FC.client.on('cart-quantity-updated', updateCartCount);
    });
  }
  
  function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount && typeof FC === 'object') {
      FC.client.request('cart').done(function(dataJSON) {
        cartCount.textContent = dataJSON.total_items || 0;
      });
    }
  }
});
