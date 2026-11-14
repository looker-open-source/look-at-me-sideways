# E5: Avoid Multiplicative Fanout in Explores

## Why?

Joining multiple independent `one_to_many` branches from the same explore (or using `many_to_many` joins) can cause multiplicative fanout, making queries slow and creating spurious many-to-many relationships between unrelated entities. While Looker's symmetric aggregates can still compute accurate measures in some cases, the resulting cross-product of rows often confuses users and degrades query performance.

## Rule

Within an `explore`:

1. No join may declare `relationship: many_to_many`.
2. When `one_to_many` joins are connected as a directed graph to the joins or base explore referenced in their join condition (`sql_on`, `sql`, or `foreign_key`), the `one_to_many` subgraph may have at most one leaf node (i.e., a linear `one_to_many` chain is allowed, but branching `one_to_many` paths are not).

## Examples

### Fails

`orders` and `favorites` are both joined `one_to_many` from `users`, forming two leaf nodes in the `one_to_many` subgraph:

```lookml
explore: users {
  join: orders {
    relationship: one_to_many
    sql_on: ${users.id} = ${orders.user_id} ;;
  }
  join: favorites {
    relationship: one_to_many
    sql_on: ${users.id} = ${favorites.user_id} ;;
  }
}
```

### Passes

A linear `one_to_many` chain (`users` -> `orders` -> `order_items`) has only one leaf node (`order_items`):

```lookml
explore: users {
  join: orders {
    relationship: one_to_many
    sql_on: ${users.id} = ${orders.user_id} ;;
  }
  join: order_items {
    relationship: one_to_many
    sql_on: ${orders.id} = ${order_items.order_id} ;;
  }
}
```

Or refactor branching `one_to_many` joins using a unioned bridge table (`user_join_paths`) so only one `one_to_many` join is needed from `users` (see [A Cure for the One-to-Many Blues](https://discuss.google.dev/t/a-cure-for-the-one-to-many-blues/119188) for a detailed walkthrough of this refactoring pattern):

```lookml
explore: users {
  join: user_join_paths {
    relationship: one_to_many
    sql_on: ${users.id} = ${user_join_paths.user_id} ;;
  }
  join: orders {
    relationship: one_to_one
    sql_on: ${user_join_paths.order_id} = ${orders.id} ;;
  }
  join: favorites {
    relationship: one_to_one
    sql_on: ${user_join_paths.favorite_id} = ${favorites.id} ;;
  }
}
```
