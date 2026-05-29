
async function testApi() {
  try {
    const response = await fetch('http://localhost:8080/api/ota/home/top-destinations');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    const text = await response.text();
    console.log('Body:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApi();
