using FoodCaseOpener.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodCaseOpener.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // Check if data already exists
        if (await context.FoodCases.AnyAsync())
        {
            return;
        }

        // 1. Ingredients
        var ingThitBaChi = new Ingredient { Name = "Thịt ba chỉ", Unit = "g" };
        var ingTrungGa = new Ingredient { Name = "Trứng gà", Unit = "quả" };
        var ingNuocDua = new Ingredient { Name = "Nước dừa tươi", Unit = "ml" };
        var ingCaLoc = new Ingredient { Name = "Cá lóc", Unit = "g" };
        var ingDuaThom = new Ingredient { Name = "Dứa (thơm)", Unit = "lát" };
        var ingCaChua = new Ingredient { Name = "Cà chua", Unit = "quả" };
        var ingDauBap = new Ingredient { Name = "Đậu bắp", Unit = "trái" };
        var ingGiaDo = new Ingredient { Name = "Giá đỗ", Unit = "g" };
        var ingSuonHeo = new Ingredient { Name = "Sườn non heo", Unit = "g" };
        var ingHanhToi = new Ingredient { Name = "Hành tỏi băm", Unit = "muỗng" };
        var ingRauMuong = new Ingredient { Name = "Rau muống", Unit = "bó" };
        var ingThitBo = new Ingredient { Name = "Thịt bò", Unit = "g" };
        var ingMiGoi = new Ingredient { Name = "Mì gói", Unit = "gói" };
        var ingCaiNgot = new Ingredient { Name = "Cải ngọt", Unit = "g" };
        var ingDauPhu = new Ingredient { Name = "Đậu phụ (đậu hũ)", Unit = "miếng" };
        var ingThitXay = new Ingredient { Name = "Thịt heo băm", Unit = "g" };
        var ingComNguoi = new Ingredient { Name = "Cơm nguội", Unit = "chén" };
        var ingXucXich = new Ingredient { Name = "Xúc xích", Unit = "cây" };
        var ingNuocMam = new Ingredient { Name = "Nước mắm", Unit = "muỗng canh" };

        var ingredients = new[]
        {
            ingThitBaChi, ingTrungGa, ingNuocDua, ingCaLoc, ingDuaThom, ingCaChua, ingDauBap,
            ingGiaDo, ingSuonHeo, ingHanhToi, ingRauMuong, ingThitBo, ingMiGoi, ingCaiNgot,
            ingDauPhu, ingThitXay, ingComNguoi, ingXucXich, ingNuocMam
        };
        await context.Ingredients.AddRangeAsync(ingredients);
        await context.SaveChangesAsync();

        // 2. Recipes
        var rThitKho = new Recipe
        {
            Name = "Thịt kho tàu nước dừa",
            Description = "Món ăn quốc dân đậm đà, thịt mềm béo ngậy hòa quyện cùng vị ngọt thanh của nước dừa.",
            ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 45,
            EstimatedCost = 65000,
            Difficulty = "Medium",
            Instructions = "1. Rửa sạch thịt ba chỉ, thái miếng vuông vừa ăn, luộc sơ qua nước sôi.\n2. Ướp thịt với hành tỏi băm, nước mắm, đường, hạt tiêu trong 20 phút.\n3. Luộc chín trứng gà và bóc vỏ.\n4. Thắng nước màu đường caramel, cho thịt vào đảo săn đều.\n5. Đổ nước dừa tươi ngập thịt, đun sôi rồi hạ lửa nhỏ liu riu kho trong 35-40 phút.\n6. Thêm trứng luộc vào kho thêm 10 phút đến khi nước cạn sánh vàng óng."
        };

        var rCanhChua = new Recipe
        {
            Name = "Canh chua cá lóc miền Tây",
            Description = "Hương vị thanh mát chua ngọt giải nhiệt, thơm nức mùi ngò gai rau ngổ.",
            ImageUrl = "https://images.unsplash.com/photo-1547496502-affa22d38842?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 30,
            EstimatedCost = 55000,
            Difficulty = "Medium",
            Instructions = "1. Làm sạch cá lóc, cắt khúc vừa ăn, khứa nhẹ ướp chút muối và tiêu.\n2. Cà chua bổ múi cau, dứa cắt lát tam giác, đậu bắp cắt xéo.\n3. Phi thơm tỏi phi giòn để riêng. Xào sơ cà chua và dứa cho ra màu đẹp.\n4. Đổ nước dùng đun sôi, thả me lọc lấy nước chua thanh.\n5. Thả cá lóc vào đun chín tới trong 7-10 phút.\n6. Cho đậu bắp, giá đỗ vào sôi bùng thì tắt bếp, rắc rau om ngò gai và tỏi phi lên trên."
        };

        var rSuonXao = new Recipe
        {
            Name = "Sườn non xào chua ngọt",
            Description = "Từng dẻ sườn vàng ruộm phủ sốt chua cay mặn ngọt sóng sánh, cực kỳ đưa cơm.",
            ImageUrl = "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 35,
            EstimatedCost = 70000,
            Difficulty = "Hard",
            Instructions = "1. Sườn non chặt khúc 3cm, chần sơ nước sôi khử mùi hôi.\n2. Pha nước sốt: 2 thìa giấm/nước cốt chanh, 2 thìa đường, 2 thìa nước mắm, 1 thìa tương cà, 1 thìa tương ớt.\n3. Rán sườn trên chảo cho vàng đều hai mặt.\n4. Phi thơm tỏi băm, trút sườn và hỗn hợp sốt vào đảo đều.\n5. Đậy nắp rim lửa nhỏ cho sốt ngấm vào thớ thịt đến khi cạn sền sệt, rắc thêm tiêu và hành hoa."
        };

        var rRauMuongXao = new Recipe
        {
            Name = "Rau muống xào tỏi giòn xanh",
            Description = "Món rau xào dân dã giòn sần sật, thơm nồng tỏi đập dập thơm lừng.",
            ImageUrl = "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 10,
            EstimatedCost = 15000,
            Difficulty = "Easy",
            Instructions = "1. Nhặt rau muống lấy phần ngọn non, ngâm rửa sạch để thật ráo nước.\n2. Đun nước sôi già có chút muối, chần nhanh rau trong 30 giây rồi vớt thả ngay vào âu nước đá để rau giòn xanh.\n3. Đập dập nhiều tỏi tép.\n4. Cho mỡ/dầu vào chảo thật nóng, phi vàng một nửa tỏi rồi cho rau vào xào lửa lớn đảo nhanh tay.\n5. Nêm bột nêm, nước mắm vừa ăn, cho nốt phần tỏi còn lại vào đảo đều 1 phút rồi tắt bếp."
        };

        var rMiXaoBo = new Recipe
        {
            Name = "Mì gói xào bò cải ngọt",
            Description = "Bữa ăn tiện lợi chỉ 15 phút nhưng đầy đủ dinh dưỡng, thơm phức mùi thịt bò xào.",
            ImageUrl = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 15,
            EstimatedCost = 38000,
            Difficulty = "Easy",
            Instructions = "1. Thịt bò thái mỏng ướp tỏi băm, dầu hào, tiêu và chút hạt nêm.\n2. Mì chần nước sôi 1 phút rồi vớt ra xả nước lạnh, trộn chút dầu ăn để sợi mì không dính.\n3. Phi tỏi, xào thịt bò trên lửa lớn chín tái trong 1-2 phút rồi trút ra đĩa.\n4. Xào cải ngọt vừa chín tới, cho sợi mì vào đảo cùng chút xì dầu.\n5. Đổ thịt bò vào trộn đều, rắc tiêu và dọn ra đĩa thưởng thức."
        };

        var rDauSotCa = new Recipe
        {
            Name = "Đậu sốt cà chua thanh đạm",
            Description = "Miếng đậu rán vàng giòn ngập trong nước sốt cà chua đỏ tươi óng ánh, chi phí siêu rẻ.",
            ImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 15,
            EstimatedCost = 20000,
            Difficulty = "Easy",
            Instructions = "1. Đậu phụ cắt miếng vuông vừa ăn, chiên vàng đều các mặt rồi vớt ra.\n2. Cà chua rửa sạch băm nhỏ hoặc thái hạt lựu.\n3. Phi thơm hành tím băm, trút cà chua vào xào nhuyễn, thêm 1/2 chén nước lọc và nêm gia vị, nước mắm, đường.\n4. Cho đậu chiên vào đảo nhẹ tay cho ngấm đều sốt cà trong 5 phút.\n5. Rắc hành lá thái nhỏ lên trên rồi tắt bếp."
        };

        var rComChien = new Recipe
        {
            Name = "Cơm chiên trứng xúc xích",
            Description = "Tận dụng cơm nguội làm món cơm chiên hạt vàng ươm tơi xốp, bùi bùi béo ngậy.",
            ImageUrl = "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 15,
            EstimatedCost = 25000,
            Difficulty = "Easy",
            Instructions = "1. Cơm nguội bóp tơi, trộn đều với 1 lòng đỏ trứng gà để khi chiên hạt cơm có màu vàng óng.\n2. Xúc xích thái hạt lựu, hành lá thái nhỏ.\n3. Đánh tan 1 quả trứng chiên tơi rồi để riêng.\n4. Phi thơm đầu hành, cho cơm vào rang lửa lớn liên tục đảo cho hạt săn lại.\n5. Cho xúc xích và trứng vào đảo cùng, nêm nước mắm hạt nêm vừa vị, rắc hành tiêu thơm nức."
        };

        var rDauNhoiThit = new Recipe
        {
            Name = "Đậu hũ nhồi thịt sốt cà chua",
            Description = "Vỏ ngoài béo mềm bọc lớp nhân thịt ngọt ngào đậm đà, món ăn quen thuộc của mọi sinh viên.",
            ImageUrl = "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80",
            CookingTimeMinutes = 25,
            EstimatedCost = 35000,
            Difficulty = "Medium",
            Instructions = "1. Thịt băm ướp hành tím, hạt tiêu, nước mắm, chút mộc nhĩ nấm hương băm nhỏ.\n2. Đậu hũ rạch một đường ở giữa hoặc khoét nhẹ ruột, nhồi chặt phần thịt băm vào.\n3. Chiên áp chảo mặt nhồi thịt cho vàng cố định.\n4. Nấu sốt cà chua sền sệt, thả đậu nhồi thịt vào rim nhỏ lửa 10 phút cho thịt chín kỹ và thấm sốt.\n5. Bày ra đĩa rắc hành ngò lên trên."
        };

        var recipes = new[]
        {
            rThitKho, rCanhChua, rSuonXao, rRauMuongXao, rMiXaoBo, rDauSotCa, rComChien, rDauNhoiThit
        };
        await context.Recipes.AddRangeAsync(recipes);
        await context.SaveChangesAsync();

        // 3. RecipeIngredients
        var recipeIngredients = new List<RecipeIngredient>
        {
            new() { RecipeId = rThitKho.Id, IngredientId = ingThitBaChi.Id, Quantity = 500 },
            new() { RecipeId = rThitKho.Id, IngredientId = ingTrungGa.Id, Quantity = 4 },
            new() { RecipeId = rThitKho.Id, IngredientId = ingNuocDua.Id, Quantity = 300 },
            new() { RecipeId = rThitKho.Id, IngredientId = ingNuocMam.Id, Quantity = 3 },

            new() { RecipeId = rCanhChua.Id, IngredientId = ingCaLoc.Id, Quantity = 400 },
            new() { RecipeId = rCanhChua.Id, IngredientId = ingDuaThom.Id, Quantity = 4 },
            new() { RecipeId = rCanhChua.Id, IngredientId = ingCaChua.Id, Quantity = 2 },
            new() { RecipeId = rCanhChua.Id, IngredientId = ingDauBap.Id, Quantity = 6 },
            new() { RecipeId = rCanhChua.Id, IngredientId = ingGiaDo.Id, Quantity = 100 },

            new() { RecipeId = rSuonXao.Id, IngredientId = ingSuonHeo.Id, Quantity = 500 },
            new() { RecipeId = rSuonXao.Id, IngredientId = ingHanhToi.Id, Quantity = 2 },
            new() { RecipeId = rSuonXao.Id, IngredientId = ingNuocMam.Id, Quantity = 2 },

            new() { RecipeId = rRauMuongXao.Id, IngredientId = ingRauMuong.Id, Quantity = 1 },
            new() { RecipeId = rRauMuongXao.Id, IngredientId = ingHanhToi.Id, Quantity = 2 },

            new() { RecipeId = rMiXaoBo.Id, IngredientId = ingMiGoi.Id, Quantity = 2 },
            new() { RecipeId = rMiXaoBo.Id, IngredientId = ingThitBo.Id, Quantity = 150 },
            new() { RecipeId = rMiXaoBo.Id, IngredientId = ingCaiNgot.Id, Quantity = 150 },

            new() { RecipeId = rDauSotCa.Id, IngredientId = ingDauPhu.Id, Quantity = 3 },
            new() { RecipeId = rDauSotCa.Id, IngredientId = ingCaChua.Id, Quantity = 3 },
            new() { RecipeId = rDauSotCa.Id, IngredientId = ingHanhToi.Id, Quantity = 1 },

            new() { RecipeId = rComChien.Id, IngredientId = ingComNguoi.Id, Quantity = 2 },
            new() { RecipeId = rComChien.Id, IngredientId = ingTrungGa.Id, Quantity = 2 },
            new() { RecipeId = rComChien.Id, IngredientId = ingXucXich.Id, Quantity = 2 },

            new() { RecipeId = rDauNhoiThit.Id, IngredientId = ingDauPhu.Id, Quantity = 4 },
            new() { RecipeId = rDauNhoiThit.Id, IngredientId = ingThitXay.Id, Quantity = 200 },
            new() { RecipeId = rDauNhoiThit.Id, IngredientId = ingCaChua.Id, Quantity = 2 }
        };
        await context.RecipeIngredients.AddRangeAsync(recipeIngredients);

        // 4. Food Cases
        var caseHome = new FoodCase
        {
            Name = "Mâm Cơm Mẹ Nấu",
            Description = "Những món cơm nhà chuẩn vị Việt Nam truyền thống, ấm cúng và đầy ắp hương vị gia đình.",
            ImageUrl = "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80",
            IsActive = true
        };

        var caseSpeed = new FoodCase
        {
            Name = "Cấp Tốc Dưới 20 Phút",
            Description = "Dành cho những ngày bận rộn hoặc đi làm về muộn, chế biến siêu nhanh mà vẫn ngon miệng.",
            ImageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
            IsActive = true
        };

        var caseStudent = new FoodCase
        {
            Name = "Sinh Viên Tiết Kiệm",
            Description = "Ngon bổ rẻ chỉ từ 15k - 35k mỗi bữa, giải cứu ví tiền cuối tháng mà vẫn đủ chất.",
            ImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
            IsActive = true
        };

        await context.FoodCases.AddRangeAsync(caseHome, caseSpeed, caseStudent);
        await context.SaveChangesAsync();

        // 5. CaseRecipes (with Weights)
        var caseRecipes = new List<CaseRecipe>
        {
            // Case 1: Mâm Cơm Mẹ Nấu
            new() { FoodCaseId = caseHome.Id, RecipeId = rThitKho.Id, Weight = 3 },
            new() { FoodCaseId = caseHome.Id, RecipeId = rCanhChua.Id, Weight = 3 },
            new() { FoodCaseId = caseHome.Id, RecipeId = rSuonXao.Id, Weight = 2 },
            new() { FoodCaseId = caseHome.Id, RecipeId = rRauMuongXao.Id, Weight = 4 },

            // Case 2: Cấp Tốc Dưới 20 Phút
            new() { FoodCaseId = caseSpeed.Id, RecipeId = rMiXaoBo.Id, Weight = 4 },
            new() { FoodCaseId = caseSpeed.Id, RecipeId = rComChien.Id, Weight = 4 },
            new() { FoodCaseId = caseSpeed.Id, RecipeId = rDauSotCa.Id, Weight = 3 },
            new() { FoodCaseId = caseSpeed.Id, RecipeId = rRauMuongXao.Id, Weight = 3 },

            // Case 3: Sinh Viên Tiết Kiệm
            new() { FoodCaseId = caseStudent.Id, RecipeId = rDauSotCa.Id, Weight = 5 },
            new() { FoodCaseId = caseStudent.Id, RecipeId = rComChien.Id, Weight = 4 },
            new() { FoodCaseId = caseStudent.Id, RecipeId = rDauNhoiThit.Id, Weight = 3 },
            new() { FoodCaseId = caseStudent.Id, RecipeId = rRauMuongXao.Id, Weight = 4 }
        };
        await context.CaseRecipes.AddRangeAsync(caseRecipes);
        await context.SaveChangesAsync();
    }
}
