import React from 'react'

import { gql, useQuery } from 'urql'
import { useMutation } from '@apollo/client'
import { nonFieldErrors } from '../util/errutil'
import { Typography } from '@mui/material'
import FormDialog from '../dialogs/FormDialog'
import { useURLParam } from '../actions/hooks'
import { formatOverrideTime } from './util'
import { GenericError } from '../error-pages'
import Spinner from '../loading/components/Spinner'

const query = gql`
  query ($id: ID!) {
    userOverride(id: $id) {
      id
      start
      end
      addUser {
        id
        name
      }
      removeUser {
        id
        name
      }
    }
  }
`

const mutation = gql`
  mutation delete($input: [TargetInput!]!) {
    deleteAll(input: $input)
  }
`

export default function ScheduleOverrideDeleteDialog(props: {
  overrideID: string
  onClose?: () => void
}): JSX.Element {
  const [zone] = useURLParam('tz', 'local')

  const [{ data, fetching, error }] = useQuery({
    query,
    variables: { id: props.overrideID },
  })

  const [deleteOverride, deleteOverrideStatus] = useMutation(mutation, {
    variables: {
      input: [
        {
          type: 'userOverride',
          id: props.overrideID,
        },
      ],
    },
    onCompleted: props.onClose,
  })

  if (error) {
    return <GenericError error={error.message} />
  }

  if (fetching && !data) {
    return <Spinner />
  }

  const { addUser, removeUser, start, end } = data.userOverride

  const isReplace = addUser && removeUser
  const verb = addUser ? 'Added' : 'Removed'
  const time = formatOverrideTime(start, end, zone)

  const caption = isReplace
    ? `Replaced ${removeUser.name} from ${time}`
    : `${verb} from ${time}`

  return (
    <FormDialog
      title='Are you sure?'
      confirm
      subTitle={`This will delete the override for: ${
        addUser ? addUser.name : removeUser.name
      }`}
      loading={deleteOverrideStatus.loading}
      errors={nonFieldErrors(error)}
      onClose={props.onClose}
      onSubmit={() => deleteOverride()}
      form={<Typography variant='caption'>{caption}</Typography>}
    />
  )
}
