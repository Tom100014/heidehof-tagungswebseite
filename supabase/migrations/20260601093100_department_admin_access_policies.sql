create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = any(_roles)
  )
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and (
        role = _role
        or (_role = 'admin'::public.app_role and role = 'director'::public.app_role)
      )
  )
$$;

drop policy if exists "department service read restaurant orders" on public.restaurant_orders;
create policy "department service read restaurant orders"
on public.restaurant_orders for select
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service update restaurant orders" on public.restaurant_orders;
create policy "department service update restaurant orders"
on public.restaurant_orders for update
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]))
with check (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service delete restaurant orders" on public.restaurant_orders;
create policy "department service delete restaurant orders"
on public.restaurant_orders for delete
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service read room orders" on public.room_orders;
create policy "department service read room orders"
on public.room_orders for select
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service update room orders" on public.room_orders;
create policy "department service update room orders"
on public.room_orders for update
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]))
with check (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service delete room orders" on public.room_orders;
create policy "department service delete room orders"
on public.room_orders for delete
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service read complaints" on public.complaints;
create policy "department service read complaints"
on public.complaints for select
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service update complaints" on public.complaints;
create policy "department service update complaints"
on public.complaints for update
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]))
with check (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department service delete complaints" on public.complaints;
create policy "department service delete complaints"
on public.complaints for delete
using (public.has_any_role(auth.uid(), array['admin','director','service']::public.app_role[]));

drop policy if exists "department kitchen read conference orders" on public.conference_orders;
create policy "department kitchen read conference orders"
on public.conference_orders for select
using (public.has_any_role(auth.uid(), array['admin','director','kitchen']::public.app_role[]));

drop policy if exists "department kitchen update conference orders" on public.conference_orders;
create policy "department kitchen update conference orders"
on public.conference_orders for update
using (public.has_any_role(auth.uid(), array['admin','director','kitchen']::public.app_role[]))
with check (public.has_any_role(auth.uid(), array['admin','director','kitchen']::public.app_role[]));

drop policy if exists "department kitchen delete conference orders" on public.conference_orders;
create policy "department kitchen delete conference orders"
on public.conference_orders for delete
using (public.has_any_role(auth.uid(), array['admin','director','kitchen']::public.app_role[]));

drop policy if exists "department kitchen read conference order items" on public.conference_order_items;
create policy "department kitchen read conference order items"
on public.conference_order_items for select
using (public.has_any_role(auth.uid(), array['admin','director','kitchen']::public.app_role[]));

drop policy if exists "department kitchen read rooms" on public.conference_rooms;
create policy "department kitchen read rooms"
on public.conference_rooms for select
using (public.has_any_role(auth.uid(), array['admin','director','kitchen','conference']::public.app_role[]));

drop policy if exists "department kitchen read dishes" on public.conference_dishes;
create policy "department kitchen read dishes"
on public.conference_dishes for select
using (public.has_any_role(auth.uid(), array['admin','director','kitchen']::public.app_role[]));

drop policy if exists "department conference read inquiries" on public.tagungs_inquiries;
create policy "department conference read inquiries"
on public.tagungs_inquiries for select
using (public.has_any_role(auth.uid(), array['admin','director','conference']::public.app_role[]));

drop policy if exists "department conference update inquiries" on public.tagungs_inquiries;
create policy "department conference update inquiries"
on public.tagungs_inquiries for update
using (public.has_any_role(auth.uid(), array['admin','director','conference']::public.app_role[]))
with check (public.has_any_role(auth.uid(), array['admin','director','conference']::public.app_role[]));

drop policy if exists "department conference delete inquiries" on public.tagungs_inquiries;
create policy "department conference delete inquiries"
on public.tagungs_inquiries for delete
using (public.has_any_role(auth.uid(), array['admin','director','conference']::public.app_role[]));

drop policy if exists "department conference read clara conversations" on public.clara_conversations;
create policy "department conference read clara conversations"
on public.clara_conversations for select
using (public.has_any_role(auth.uid(), array['admin','director','conference']::public.app_role[]));
