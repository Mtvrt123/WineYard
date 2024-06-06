using Frontend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Frontend.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }
        
        public IActionResult AddUser()
        {
            return View();
        }

        [HttpPost]
        public IActionResult AddUser(User user)
        {
            if (ModelState.IsValid)
            {   
                API.AddUser(user.username, user.password);

                return RedirectToAction("Index");
            }
            return View(user);
        }

        public IActionResult GetToken()
        {
            return View();
        }

        [HttpPost]
        public IActionResult GetToken(User user)
        {
            if (ModelState.IsValid)
            {
                API.GetToken(user.username, user.password);

                return RedirectToAction("Index");
            }
            return View(user);
        }

        public IActionResult AddBottle()
        {
            return View();
        }

        [HttpPost]
        public IActionResult AddBottle(BottleDTO bottle)
        {
            if (ModelState.IsValid)
            {
                API.AddBottle(bottle.name, bottle.year, bottle.price);

                return RedirectToAction("GetBottles");
            }
            return View(bottle);
        }

        public IActionResult GetBottles()
        {
            return View(API.getBottles());
        }

        // <a asp-action="Edit" asp-route-id="@item.id">Edit</a> |
        // <a asp-action="Delete" asp-route-id="@item.id">Delete</a>

        public IActionResult Edit(string id)
        {
            List<Bottle> bottles = API.getBottles();


            Bottle bottle = bottles.Find(b => b.id == id);

            if (bottle == null)
            {
                return RedirectToAction("GetBottles");
            }

            return View(bottle);
        }

        [HttpPost]
        public IActionResult Edit(Bottle bottle)
        {
            if (ModelState.IsValid)
            {
                API.UpdateBottle(bottle.id, bottle.name, bottle.year, bottle.price);

                return RedirectToAction("GetBottles");
            }
            return View(bottle);
        }

        public IActionResult Delete(string id) {
            
            API.DeleteBottle(id);

            return RedirectToAction("GetBottles");
        }
    }
}
