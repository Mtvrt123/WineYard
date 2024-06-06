using Frontend.Models;
using Newtonsoft.Json;
using System.Text;

namespace Frontend
{
    /*
       ┌──────────────────────────────────────────────────────────────────────────────────┐
   │                                                                                  │
   │   POST   | http://localhost:3000/local/bottle                                    │

   │   GET    | http://localhost:3000/local/bottles                                   │

   │   GET    | http://localhost:3000/local/bottle/{id}                               │

   │   PUT    | http://localhost:3000/local/bottle/{id}                               │

   │   DELETE | http://localhost:3000/local/bottle/{id}                               │

   │   GET    | http://localhost:3000/local/events                                    │

   │   POST   | http://localhost:3000/local/token                                     │

   │   POST   | http://localhost:3000/local/user                                      │

   │                                                                                 

    */

    public class API
    {
        public static string BaseUrl = "http://localhost:3000";
        public static string LocalBottle = "/local/bottle";
        public static string LocalBottles = "/local/bottles";
        public static string LocalBottleId = "/local/bottle/{id}";
        public static string LocalEvents = "/local/events";
        public static string LocalToken = "/local/token";
        public static string LocalUser = "/local/user";

        public static string token = "";

        public static void AddUser(string username, string password)
        {

            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(BaseUrl);
            var content = new StringContent(JsonConvert.SerializeObject(new { username = username, password = password }), Encoding.UTF8, "application/json");
            HttpResponseMessage response = client.PostAsync(LocalUser, content).Result;

            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                Console.WriteLine(json);
            }
        }

        public static void GetToken(string username, string password)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(BaseUrl);
            var content = new StringContent(JsonConvert.SerializeObject(new { username = username, password = password }), Encoding.UTF8, "application/json");
            HttpResponseMessage response = client.PostAsync(LocalToken, content).Result;

            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                
                token = JsonConvert.DeserializeObject<Token>(json).token;
            }
        }

        public static List<Bottle> getBottles()
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(BaseUrl);

            client.DefaultRequestHeaders.Add("Authorization", token);

            HttpResponseMessage response = client.GetAsync(LocalBottles).Result;
            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                
                return JsonConvert.DeserializeObject<List<Bottle>>(json);

            }
            return null;
        }

        public static void AddBottle(string name, string year, string price)
        {
            HttpClient client = new HttpClient();

            client.BaseAddress = new Uri(BaseUrl);

            client.DefaultRequestHeaders.Add("Authorization", token);

            var content = new StringContent(JsonConvert.SerializeObject(new { name = name, year = year, price = price }), Encoding.UTF8, "application/json");

            HttpResponseMessage response = client.PostAsync(LocalBottle, content).Result;

            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                Console.WriteLine(json);
            }
        }

        public static void DeleteBottle(string id)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(BaseUrl);

            client.DefaultRequestHeaders.Add("Authorization", token);

            HttpResponseMessage response = client.DeleteAsync(LocalBottleId.Replace("{id}", id)).Result;

            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                Console.WriteLine(json);
            }
        }

        public static void UpdateBottle(string id, string name, string year, string price)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(BaseUrl);

            client.DefaultRequestHeaders.Add("Authorization", token);

            var content = new StringContent(JsonConvert.SerializeObject(new { name = name, year = year, price = price }), Encoding.UTF8, "application/json");

            HttpResponseMessage response = client.PutAsync(LocalBottleId.Replace("{id}", id), content).Result;

            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                Console.WriteLine(json);
            }
        }
    }
}
