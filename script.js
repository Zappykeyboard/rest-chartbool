function init() {
  //ottengo i dati
  getData();

  $("#submit").on("click", addSale);
}

$(document).ready(init);

//ottengo vendite divise per trimestre
function getQuarterlySales(salesByMonth) {

  var quarterlySalesArr = new Array(4).fill(0);

  var index = 0;

  for (var i = 0; i < salesByMonth.length; i++) {

    var d = salesByMonth[i];

    switch (i) {
      case 2:
        quarterlySalesArr[index] += d;
        index += 1;
        break;
      case 5:
        quarterlySalesArr[index] += d;
        index += 1;
        break;
      case 8:
        quarterlySalesArr[index] += d;
        index += 1;
        break;
      case 11:
        quarterlySalesArr[index] += d;
        index += 1;
        break;

    }
  }
  return quarterlySalesArr;
}

//aggiungo una vendita al database
function addSale() {

  //recupero i dati dal form
  var theData = {};
  theData.salesman = $("#employee-select").val();
  theData.amount = $("#sales-field").val();
  var monthNum = moment().month($("#month-select").val()).format("MM");

  theData.date = "01/" + monthNum + "/2017";

  console.log(theData);
  $.ajax({
    url: "http://157.230.17.132:4001/sales",
    method: "POST",
    data: theData,
    success: function () {
      getData();
    },
    error: function () {
      alert("Error")
    }
  })
}


//inserisco le opzioni dei dipendenti in base ai dati ricevuti
function fillEmployeeOptions(employees) {

  var optionHtml = $("#employee-template").html();
  var optionTemplate = Handlebars.compile(optionHtml);
  $("#employee-select").empty();
  for (var i = 0; i < employees.length; i++) {

    var context = {
      name: employees[i]
    }

    var html = optionTemplate(context);


    $("#employee-select").append(html);
  }
}

//restituisce i mesi dell'anno in italiano
function getMonths() {
  moment.locale("it");

  var months = moment.months();

  return months;
}

//ricavo array di dipendenti
function getEmployees(data) {
  var employees = [];

  for (var i = 0; i < data.length; i++) {
    var d = data[i];

    if (!employees.includes(d.salesman)) {
      employees.push(d.salesman);
    }
  }
  return employees;
}

//sommo le vendite in base al dipendente
function getSalesByEmployee(data) {
  var employeeSales = {};

  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    if (!employeeSales[d.salesman]) {
      employeeSales[d.salesman] = 0;
    }
    employeeSales[d.salesman] += Number(d.amount);
  }
  return employeeSales;
}

//sommo le vendite per mese
function getSalesByMonth(data) {

  var months = new Array(12).fill(0);

  for (var i = 0; i < data.length; i++) {
    var d = data[i];

    var monthNum = moment(d.date, "DD-MM-YYYY").month();
    var amount = Number(d.amount);

    months[monthNum] += amount;

  }
  return months;
}

//recupero dati dal server
function getData() {


  $.ajax({
    url: "http://157.230.17.132:4001/sales",
    method: "GET",
    success: function (data) {
      console.log(data);


      //ordino i dati per le chart
      var salesByEmployee = getSalesByEmployee(data);
      var salesByMonth = getSalesByMonth(data);
      var employeeArray = getEmployees(data);
      var quarterlySales = getQuarterlySales(salesByMonth);


      fillEmployeeOptions(employeeArray);

      //disegno le chart
      drawLineChart(salesByMonth);
      drawPieChart(salesByEmployee);
      drawBarChart(quarterlySales);
    },
    error: function () {
      console.log("error");
    }
  })

}

//disegno la chart a linea. Accetta array
function drawLineChart(data) {
  var element = document.getElementById("line-chart").getContext("2d");

  var theChart = new Chart(element, {
    type: "line",
    data: {
      labels: getMonths(),
      datasets: [{
        label: 'Vendite',
        borderColor: 'rgba(255, 99, 132, 1)',
        data: data
      }]
    }
  })
}

//disegno la chart a torta
function drawPieChart(employeeSales) {
  var element = document.getElementById("pie-chart").getContext("2d");

  var employees = Object.keys(employeeSales);
  var sales = Object.values(employeeSales);

  var totalSales = 0

  //calcolo le vendite totali
  for (var i = 0; i < sales.length; i++) {
    totalSales += sales[i];
  }

  var salesPercentages = [];

  //converto le vendite in percentuali
  for (var i = 0; i < sales.length; i++) {
    var percentage = ((sales[i] / totalSales) * 100).toFixed(1);

    salesPercentages.push(percentage);
  }

  console.log("vendite totali: ", totalSales);
  console.log(salesPercentages);

  var theChart = new Chart(element, {
    type: "pie",
    data: {
      labels: employees,
      datasets: [{
        label: 'Vendite',
        backgroundColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        data: salesPercentages
      }]
    }
  })
}

function drawBarChart(quarterlySales) {
  var ctx = document.getElementById("bar-chart").getContext("2d");


  var myBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [{
        label: "Vendite trimestrali",
        data: quarterlySales
      }]

    }
  });
}
