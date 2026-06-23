function mergeToUDML(dcslTree, aglTree, rbacTree) {
    // Khởi tạo cây UDML gốc (Copy từ DCSL và AGL)
    let udmlTree = {
        entities: [...dcslTree.entities],
        activities: JSON.parse(JSON.stringify(aglTree.activities)) // Deep copy
    };

    // Bắt đầu Tree-Merging
    rbacTree.policies.forEach(policy => {
        policy.rules.forEach(rule => {
            if (rule.effect === "allow") {
                // 1. Tìm Activity/Action tương ứng trong cây AGL
                let targetActivity = udmlTree.activities.find(
                    act => act.name === rule.action && act.entity === rule.resource
                );

                if (targetActivity) {
                    // 2. Decorate (Trang trí/Grafting) thông tin RBAC vào Node
                    if (!targetActivity.securityContext) {
                        targetActivity.securityContext = { allowedRoles: [], constraints: [] };
                    }
                    
                    // Thêm Role được phép
                    if (!targetActivity.securityContext.allowedRoles.includes(policy.role)) {
                        targetActivity.securityContext.allowedRoles.push(policy.role);
                    }

                    // Thêm Ràng buộc (như SoD)
                    if (rule.constraints) {
                        targetActivity.securityContext.constraints.push(...rule.constraints);
                    }
                }
            }
        });
    });

    return udmlTree;
}

/*
{
  "name": "approveTicket",
  "entity": "Ticket",
  "nodes": [...], // Logic từ AGL
  "securityContext": { 
     "allowedRoles": ["Supervisor"],
     "constraints": ["SoD"]
  }
}
*/