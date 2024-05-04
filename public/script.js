const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');
const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

const express = require('express');
const app = express();

app.use(express.static('public'));

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    closeModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}

registerLink.addEventListener('click', ()=> {
    wrapper.classList.add('active');
})

loginLink.addEventListener('click', ()=> {
    wrapper.classList.remove('active');
})

btnPopup.addEventListener('click', ()=> {
    wrapper.classList.add('active-popup');
})

iconClose.addEventListener('click', ()=> {
    wrapper.classList.remove('active-popup');
})

//skills page
window.onload = function() {
    console.log('hi')
    fetch('http://localhost:3001/skillsArray')
      .then(res => res.json())
      .then(data => {
          const select = document.getElementById('skillSelect');
          console.log('hi')
          data.forEach(skill => {
              const option = document.createElement('option');
              option.value = skill._id;
              option.textContent = skill.name;
              select.appendChild(option);
          });
      })
      .catch(error => console.error('Error loading the skills:', error));
};


//allows a session to persist
async function updateLocation(city, state) {
  try {
      const response = await fetch('/location-worker', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ city, state }),
          credentials: 'include'
      });
      const data = await response.json();
      console.log('Location update successful:', data);
      return data;
  } catch (error) {
      console.error('Update location error:', error);
      throw error;
  }
}

async function loginUser(email, password) {
  try {
      const response = await fetch('/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
      });
      const data = await response.json();
      console.log('Login successful:', data);
      return data;
  } catch (error) {
      console.error('Login error:', error);
      throw error;
  }
}




document.getElementById("login-button").addEventListener("click", function() {
  const email = document.getElementsByName("email").value;
  const password = document.getElementsByName("password").value;
  loginUser(email, password)
      .then(data => {
          if (data.success) {
              // Continue with your application logic here
              console.log('Logged in successfully');
          }
      })
      .catch(error => {
          console.log('Failed to log in');
      });
});

document.getElementById("location-worker-button").addEventListener("click", function() {
  const state = document.getElementByName("state").value;
  const city = document.getElementsByName("city").value;
  updateLocation(state, city)
      .then(data => {
          if (data.success) {
              // Continue with your application logic here
              console.log('Logged in successfully');
          }
      })
      .catch(error => {
          console.log('Failed to log in');
      });
});