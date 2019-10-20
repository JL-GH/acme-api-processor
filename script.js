// let companies;
// let products;
// let offerings;

const grabCompanies = () => new Promise((res, rej) => {
  return window.fetch('https://acme-users-api-rev.herokuapp.com/api/companies')
          .then(response => response.json())
          .then(jsonData => {
            res(jsonData)
            companies = jsonData
          })
          .catch(e => rej(e));
})

const grabProducts = () => new Promise((res, rej) => {
  return window.fetch('https://acme-users-api-rev.herokuapp.com/api/products')
          .then(response => response.json())
          .then(jsonData => {
            res(jsonData)
            products = jsonData
          })
          .catch(e => rej(e));
})


const grabOfferings = () => new Promise((res, rej) => {
  return window.fetch('https://acme-users-api-rev.herokuapp.com/api/offerings')
          .then(response => response.json())
          .then(jsonData => {
            res(jsonData)
            offerings = jsonData
          })
          .catch(e => rej(e));
})

// grabCompanies();
// grabOfferings();
// grabProducts();

const grabCompaniesResult = grabCompanies();
const grabProductsResult = grabProducts();
const grabOfferingsResult = grabOfferings();

Promise.all([grabCompaniesResult, grabProductsResult, grabOfferingsResult])
  // .then(values => console.log(values))
  .then(([companies, products, offerings]) => {
    const productsInPriceRange = findProductsInPriceRange(products, {min: 1, max: 15})
    console.log('---------productsInPriceRange----------')
    console.log(productsInPriceRange)

    const groupedCompaniesByLetter = groupCompaniesByLetter(companies)
    console.log('---------groupedCompaniesByLetter----------')
    console.log(groupedCompaniesByLetter)

    const groupedCompaniesByState = groupCompaniesByState(companies)
    console.log('---------groupedCompaniesByState----------')
    console.log(groupedCompaniesByState)

    const processedOfferings = processOfferings({companies, products, offerings})
    console.log('---------processedOfferings----------')
    console.log (processedOfferings)

    const threeOrMoreOfferings = companiesByNumberOfOfferings(companies, offerings, 3)
    console.log('---------threeOrMoreOfferings----------')
    console.log(threeOrMoreOfferings)

    const processedProducts = processProducts({products, offerings})
    console.log('---------processedProducts----------')
    console.log(processedProducts)
  })


const findProductsInPriceRange = (arrProd, objMinMax) => {
  if (Array.isArray(arrProd)){
    return arrProd.filter((elem) => {
      if (elem.suggestedPrice >= objMinMax.min && elem.suggestedPrice <= objMinMax.max) {
        return elem
      }
    })
  }
}


const groupCompaniesByLetter = arrComp => {
  return arrComp.reduce((accu, curVal) => {
    let key = curVal.name[0];

    if (!(key in accu)) {
      accu[key] = [curVal.name]
    }
    else {
      accu[key] = accu[key].concat([curVal.name])
    }
    return accu
  }, {})
}

const groupCompaniesByState = arrComp => {
  return arrComp.reduce((accu, curVal) => {
    let key = curVal.state;

    if (!(key in accu)) {
      accu[key] = [curVal.name]
    }
    else {
      accu[key] = accu[key].concat([curVal.name])
    }
    return accu
  }, {})
}

const processOfferings = objOfArrPromResults => {
  let offerings = objOfArrPromResults.offerings
  let products = objOfArrPromResults.products
  let companies = objOfArrPromResults.companies

  offerings.forEach((elem) => {
    let foundProduct = products.find(x => x.id === elem.productId)
    let foundCompany = companies.find(x => x.id === elem.companyId)

    if (elem.productId === foundProduct.id) {
      elem.productInfo = foundProduct
    }

    if (elem.companyId === foundCompany.id) {
      elem.companyInfo = foundCompany
    }
  })

  return offerings
}

const companiesByNumberOfOfferings = (arrComp, arrOffer, num) => {
  //declare a obj dictionary where I can reference all companyIds that have X number of offerings
  let compOffCount = arrOffer.reduce((accu, curVal) => {
    let compId = curVal.companyId
    // let counter = 0
    if (!(compId in accu)) {
      accu[compId] = 1
    }
    else {
      accu[compId] ++
    }
    return accu
  }, {})

  //return the array of companies where it is greater or equal to num
  return arrComp.reduce((accuComps, curComp) => {
    if (compOffCount[curComp.id] >= num) {
      accuComps.push(curComp)
    }

    return accuComps
  }, [])
}

const processProducts = (objOfArrProdOffers) => {
  //declare obj dictionary with productID as key and value is another obj containing 2 keyvalue pairs 1) totalSum & 2) counter

  let arrProd = objOfArrProdOffers.products
  let arrOffers = objOfArrProdOffers.offerings
  let offerDict = arrOffers.reduce((accuDict, curOffering) => {
    let key = curOffering.productId
    if (!(key in accuDict)) {
      accuDict[key] = {}
      accuDict[key]['totalSum'] = curOffering.price
      accuDict[key]['counter'] = 1
    }
    else {
      accuDict[key].totalSum += curOffering.price
      accuDict[key].counter += 1
    }
    return accuDict
  }, {})

  //add average to the obj
  let keys = Object.keys(offerDict)
  for (let key of keys) {
    let curKey = offerDict[key]
    curKey['avg'] = Number((curKey.totalSum / curKey.counter).toFixed(2))
  }

  //add the avgPrice of the offerings to the array of products
  arrProd.forEach((elem) => {
    if (elem.id in offerDict) {
      elem['avgPrice'] = offerDict[elem.id].avg
    }
  })

  return arrProd
}